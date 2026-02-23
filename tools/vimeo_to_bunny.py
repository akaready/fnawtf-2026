import requests
import os
import sys
import json
import time
from datetime import datetime, timezone
import concurrent.futures
import uuid
from dotenv import load_dotenv

load_dotenv()

DRY_RUN = "--dry-run" in sys.argv


def getProcessedVideos():
    """Read already-transferred Vimeo URLs from UrlMapping.json."""
    if not os.path.exists("UrlMapping.json"):
        return []
    try:
        with open("UrlMapping.json", "r", encoding="utf8") as f:
            data = json.load(f)
        return [entry["vimeo_url"] for entry in data if "vimeo_url" in entry]
    except Exception as e:
        print(f"Error reading UrlMapping.json: {e}")
        return []


def save_data(new_data):
    try:
        if os.path.exists("UrlMapping.json"):
            with open("UrlMapping.json", "r", encoding="utf8") as f:
                data = json.load(f)
        else:
            data = []

        data.append(new_data)

        with open("UrlMapping.json", "w", encoding="utf8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving to UrlMapping.json: {e}")


def get_vimeo_data(path):
    access_token = os.getenv("ACCESS_TOKEN")

    url = f"https://api.vimeo.com{path}"
    headers = {
        "Authorization": f"bearer {access_token}",
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers, timeout=30)

    if 500 <= response.status_code < 600:
        time.sleep(30)
        response = requests.get(url, headers=headers, timeout=30)

    if response.status_code == 429:
        time.sleep(60)
        response = requests.get(url, headers=headers, timeout=30)

    if response.status_code != 200:
        raise Exception(f"Error: {response.status_code}")
    return response.json()


def folder_matches_target(folder):
    """
    Returns True if this folder IS the target folder or is nested inside it.

    VIMEO_SOURCE_FOLDER: name of the root folder to transfer (e.g. "FNA")
    VIMEO_SOURCE_PARENT: optional parent name to disambiguate if needed
    """
    source_folder = os.getenv("VIMEO_SOURCE_FOLDER", "").strip()
    source_parent = os.getenv("VIMEO_SOURCE_PARENT", "").strip()

    if not source_folder:
        return True  # No filter configured — process everything

    folder_name = folder.get("name", "")
    ancestor_path = folder.get("metadata", {}).get("connections", {}).get("ancestor_path", [])
    ancestor_names = [a["name"] for a in ancestor_path]

    # Match the target folder itself, OR any folder nested inside it
    is_target = folder_name.lower() == source_folder.lower()
    is_inside_target = any(a.lower() == source_folder.lower() for a in ancestor_names)

    if not (is_target or is_inside_target):
        return False

    # If a parent is specified, verify it appears in the ancestor chain
    if source_parent:
        if not any(a.lower() == source_parent.lower() for a in ancestor_names):
            return False

    return True


def getVimeoVideos():
    try:
        source_folder = os.getenv("VIMEO_SOURCE_FOLDER", "").strip()
        source_parent = os.getenv("VIMEO_SOURCE_PARENT", "").strip()

        if source_folder:
            scope_desc = f'"{source_parent} > {source_folder}"' if source_parent else f'"{source_folder}"'
            print(f"Targeting Vimeo folder: {scope_desc}")
        else:
            print("No VIMEO_SOURCE_FOLDER set — processing all folders")

        if DRY_RUN:
            print("DRY RUN MODE — nothing will be downloaded or uploaded\n")

        team_id = os.getenv("VIMEO_TEAM_ID", "").strip()
        if team_id:
            print(f"Using team library: {team_id}")
            next_page = f"/teams/{team_id}/folders?page=1"
        else:
            next_page = "/me/folders?page=1"

        processedVideos = getProcessedVideos() if not DRY_RUN else []

        def process_video_wrapper(args):
            name, collection, download_link, video_link = args
            if DRY_RUN:
                print(f"[dry-run] Would transfer: '{name}' (collection: '{collection}')")
                return
            if video_link not in processedVideos:
                print(f"Transferring: {name}")
                process_video(name, collection, download_link, video_link)

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            while next_page:
                print(f"Scanning: {next_page}")
                user_folders = get_vimeo_data(next_page)
                next_page = user_folders['paging']['next']
                folders_data = user_folders['data']

                for user_folder in folders_data:
                    if not folder_matches_target(user_folder):
                        continue

                    # Use the folder's own name as the Bunny collection name
                    # to mirror subfolder structure within the target library.
                    collectionName = user_folder["name"]
                    print(f"  Found matching folder: '{collectionName}'")

                    folder_items_next_page = f"{user_folder['uri']}/videos?page=1"

                    while folder_items_next_page:
                        folder_contents = get_vimeo_data(folder_items_next_page)
                        folder_items_next_page = folder_contents['paging']['next']
                        folder_data = folder_contents['data']

                        futures = []
                        for folder_content_item in folder_data:
                            def rendition_sort_key(x):
                                r = x['rendition'].replace("p", "")
                                return int(r) if r.isdigit() else 9999  # "source" = highest

                            download_quality = max(
                                folder_content_item['download'],
                                key=rendition_sort_key
                            )
                            future = executor.submit(process_video_wrapper, (
                                folder_content_item['name'],
                                collectionName,
                                download_quality['link'],
                                folder_content_item['link']
                            ))
                            futures.append(future)
                        concurrent.futures.wait(futures)

        if DRY_RUN:
            print("\nDry run complete — no files were transferred.")
        else:
            print("All videos processed.")
    except Exception as e:
        print(f"Error: {e}")


def download_video(output_location_path, url, max_retries=3):
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(url, stream=True, timeout=300)
            response.raise_for_status()
            with open(f"videos/{output_location_path}", "wb") as writer:
                for chunk in response.iter_content(chunk_size=8192):
                    writer.write(chunk)
            return  # success
        except Exception as e:
            print(f"Download attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                time.sleep(10)
    raise Exception(f"Failed to download after {max_retries} attempts: {url}")


def upload_to_bunny_cdn(fileNameValid, fileName, collectionName, libraryId, access_key):
    try:
        url = f"https://video.bunnycdn.com/library/{libraryId}/collections?page=1&itemsPerPage=100&search={requests.utils.quote(collectionName)}&orderBy=date&includeThumbnails=false"

        headers = {
            "accept": "application/json",
            "AccessKey": access_key
        }

        response = requests.request("GET", url, headers=headers)
        data = json.loads(response.text)

        # Exact case-insensitive match to avoid attaching to the wrong collection
        collectionId = None
        for item in data.get("items", []):
            if item.get("name", "").lower() == collectionName.lower():
                collectionId = item["guid"]
                break

        if collectionId is None:
            url = f"https://video.bunnycdn.com/library/{libraryId}/collections"
            payload = {"name": collectionName}
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "AccessKey": access_key
            }
            response = requests.request("POST", url, json=payload, headers=headers)
            data = json.loads(response.text)
            collectionId = data["guid"]

        url = f"https://video.bunnycdn.com/library/{libraryId}/videos"
        video_path = f"videos/{fileNameValid}"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "AccessKey": access_key
        }

        payload = json.dumps({"title": fileName, "collectionId": collectionId})

        response = requests.request("POST", url, headers=headers, data=payload)
        data = json.loads(response.text)

        videoId = data["guid"]

        url = f"https://video.bunnycdn.com/library/{libraryId}/videos/{videoId}"

        with open(video_path, 'rb') as f:
            headers = {
                'Content-Type': 'application/octet-stream',
                'AccessKey': access_key,
            }
            response = requests.request("PUT", url, headers=headers, data=f)
            data = json.loads(response.text)
            if data["statusCode"] == 200:
                videoUrl = f"https://iframe.mediadelivery.net/play/{libraryId}/{videoId}"
                return videoUrl
            else:
                return None
    except Exception as e:
        print(f"Upload error: {e}")
        return None


def process_video(video_name, collectionName, video_link, vimeo_file_url):
    try:
        bunny_api_key = os.getenv("BUNNY_API_KEY")
        library_id = os.getenv("BUNNY_LIBRARY_ID")

        if not bunny_api_key or not library_id:
            raise Exception("BUNNY_API_KEY and BUNNY_LIBRARY_ID must be set in .env")

        file_name = f"{video_name}.mp4"
        fileNameValid = str(uuid.uuid4()) + ".mp4"
        download_video(fileNameValid, video_link)

        file_path = f"videos/{fileNameValid}"

        bunny_file_url = upload_to_bunny_cdn(fileNameValid, file_name, collectionName, library_id, bunny_api_key)
        if bunny_file_url:
            print(f"  Done: {bunny_file_url}")
        else:
            print(f"  Upload failed for: {video_name}")

        # Extract videoId from the embed URL to build the thumbnail URL
        # Format: https://iframe.mediadelivery.net/play/{libraryId}/{videoId}
        thumbnail_url = None
        if bunny_file_url:
            video_id = bunny_file_url.rstrip("/").split("/")[-1]
            cdn_hostname = os.getenv("BUNNY_CDN_HOSTNAME")
            if cdn_hostname:
                thumbnail_url = f"https://{cdn_hostname}/{video_id}/thumbnail.jpg"

        current_utc_time = datetime.now(timezone.utc)
        save_data({
            "vimeo_url": vimeo_file_url,
            "bunny_url": bunny_file_url,
            "thumbnail_url": thumbnail_url,
            "collection": collectionName,
            "title": video_name,
            "transferred_at": str(current_utc_time)
        })
        os.remove(file_path)
    except Exception as e:
        print(f"Error processing '{video_name}': {e}")


getVimeoVideos()
