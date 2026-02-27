import { getPlacementsForPage, getProjectsForBrowser } from '../actions';
import { WebsitePageClient } from './_components/WebsitePageClient';

export const dynamic = 'force-dynamic';

export default async function WebsitePage() {
  const [homepage, work, servicesBuild, servicesLaunch, servicesScale, servicesCrowdfunding, servicesFundraising, allProjects] =
    await Promise.all([
      getPlacementsForPage('homepage'),
      getPlacementsForPage('work'),
      getPlacementsForPage('services_build'),
      getPlacementsForPage('services_launch'),
      getPlacementsForPage('services_scale'),
      getPlacementsForPage('services_crowdfunding'),
      getPlacementsForPage('services_fundraising'),
      getProjectsForBrowser(),
    ]);

  return (
    <WebsitePageClient
      initialHomepage={homepage}
      initialWork={work}
      initialServices={{
        build: servicesBuild,
        launch: servicesLaunch,
        scale: servicesScale,
        crowdfunding: servicesCrowdfunding,
        fundraising: servicesFundraising,
      }}
      allProjects={allProjects}
    />
  );
}
