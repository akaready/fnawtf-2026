---
title: "Live Form Validation (Advanced)"
category: "Forms"
tags:
  - "Form"
  - "Live"
  - "Validate"
  - "Input"
  - "Textarea"
  - "Error"
  - "Notification"
  - "Checkbox"
  - "Radio"
  - "Select"
  - "Advanced"
author: "Dennis Snellenberg"
lastUpdated: "2026-02-12"
source: "https://osmo.supply"
---

Form Parent

## HTML

```html
<div data-form-validate="" class="form-group w-form">
<form id="wf-form-Default-Form" name="wf-form-Default-Form" data-name="Default Form" method="get" class="form" data-wf-page-id="6780d77ea8657fba8f267b71" data-wf-element-id="7310ef1a-7190-2f9a-9ac2-8af00a76fc82">
<div data-validate="" class="form-field-group">
<label for="name" class="form-label">Name <span class="form-required">*</span></label>
<div class="form-field">
<input class="form-input w-input" maxlength="256" name="name" data-name="Name" min="1" placeholder="Osmo" type="text" id="name" required="">
<div class="form-field-icon is--success"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path d="M11.25 14.25L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 10.5L11.25 14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12C3 16.9706 7.02943 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02943 16.9706 3 12 3C7.02943 3 3 7.02943 3 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
<div class="form-field-icon is--error"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path opacity="0.1" d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.996 14.5C11.444 14.5 10.996 14.948 11 15.5C11 16.052 11.448 16.5 12 16.5C12.552 16.5 13 16.052 13 15.5C13 14.948 12.552 14.5 11.996 14.5Z" fill="currentColor"></path></svg></div>
</div>
</div>
<div data-validate="" class="form-field-group">
<label for="email" class="form-label">Email Address <span class="form-required">*</span></label>
<div class="form-field"><input class="form-input w-input" maxlength="256" name="email" data-name="Email" placeholder="hello@osmo.supply" type="email" id="email" required="">
<div class="form-field-icon is--success"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path d="M11.25 14.25L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 10.5L11.25 14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12C3 16.9706 7.02943 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02943 16.9706 3 12 3C7.02943 3 3 7.02943 3 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
<div class="form-field-icon is--error"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path opacity="0.1" d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.996 14.5C11.444 14.5 10.996 14.948 11 15.5C11 16.052 11.448 16.5 12 16.5C12.552 16.5 13 16.052 13 15.5C13 14.948 12.552 14.5 11.996 14.5Z" fill="currentColor"></path></svg></div>
</div>
</div>
<div data-validate="" class="form-field-group">
<label for="location" class="form-label">Location <span class="form-required">*</span> <span class="form-inactive-text">(select min. 2)</span></label>
<div max="2" data-radiocheck-group="" min="2" class="radiocheck-group">
<label class="w-checkbox radiocheck-field">
<input type="checkbox" name="Location-Netherlands" id="Location-Netherlands" data-name="Location Netherlands" class="w-checkbox-input checkbox-input">
<span class="radiocheck-label w-form-label" for="Location-Netherlands">The Netherlands</span>
<div class="radiocheck-custom"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="radiocheck-check-svg"><path d="M7 11.5L10.5 15L17 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
</label>
<label class="w-checkbox radiocheck-field">
<input type="checkbox" name="Location-Germany" id="Location-Germany" data-name="Location Germany" class="w-checkbox-input checkbox-input">
<span class="radiocheck-label w-form-label" for="Location-Germany">Germany</span>
<div class="radiocheck-custom"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="radiocheck-check-svg"><path d="M7 11.5L10.5 15L17 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
</label>
<label class="w-checkbox radiocheck-field">
<input type="checkbox" name="Location-Belgium" id="Location-Belgium" data-name="Location Belgium" class="w-checkbox-input checkbox-input">
<span class="radiocheck-label w-form-label" for="Location-Belgium">Belgium</span>
<div class="radiocheck-custom"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="radiocheck-check-svg"><path d="M7 11.5L10.5 15L17 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
</label>
<div class="radiocheck-field-icon is--success"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path d="M11.25 14.25L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 10.5L11.25 14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12C3 16.9706 7.02943 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02943 16.9706 3 12 3C7.02943 3 3 7.02943 3 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
<div class="radiocheck-field-icon is--error"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path opacity="0.1" d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.996 14.5C11.444 14.5 10.996 14.948 11 15.5C11 16.052 11.448 16.5 12 16.5C12.552 16.5 13 16.052 13 15.5C13 14.948 12.552 14.5 11.996 14.5Z" fill="currentColor"></path></svg></div>
</div>
</div>
<div data-validate="" class="form-field-group">
<label for="category" class="form-label">Category <span class="form-required">*</span></label>
<div class="form-field">
<select id="field" name="field" data-name="Field" required="" class="form-input w-select">
<option value="">Select option</option>
<option value="First">First choice</option>
<option value="Second">Second choice</option>
<option value="Third">Third choice</option>
</select>
<div class="form-field-chevron"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none"><path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
<div class="form-field-icon is--select is--success"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path d="M11.25 14.25L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 10.5L11.25 14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12C3 16.9706 7.02943 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02943 16.9706 3 12 3C7.02943 3 3 7.02943 3 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
<div class="form-field-icon is--select is--error"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path opacity="0.1" d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.996 14.5C11.444 14.5 10.996 14.948 11 15.5C11 16.052 11.448 16.5 12 16.5C12.552 16.5 13 16.052 13 15.5C13 14.948 12.552 14.5 11.996 14.5Z" fill="currentColor"></path></svg></div>
</div>
</div>
<div data-validate="" class="form-field-group">
<label for="mode" class="form-label">Mode <span class="form-required">*</span></label>
<div data-radiocheck-group="" class="radiocheck-group">
<label class="radiocheck-field w-radio">
<input type="radio" name="Mode" id="Dark-mode" data-name="Mode" class="w-form-formradioinput radio-input w-radio-input" value="Dark mode">
<span class="radiocheck-label w-form-label" for="Dark-mode">Dark mode</span>
<div class="radiocheck-custom is--radio"><div class="radio-dot"></div></div>
</label>
<label class="radiocheck-field w-radio">
<input type="radio" name="Mode" id="Light-mode" data-name="Mode" class="w-form-formradioinput radio-input w-radio-input" value="Light mode">
<span class="radiocheck-label w-form-label" for="Light-mode">Light mode</span>
<div class="radiocheck-custom is--radio"><div class="radio-dot"></div></div>
</label>
<div class="radiocheck-field-icon is--success"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path d="M11.25 14.25L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 10.5L11.25 14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12C3 16.9706 7.02943 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02943 16.9706 3 12 3C7.02943 3 3 7.02943 3 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
<div class="radiocheck-field-icon is--error"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path opacity="0.1" d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.996 14.5C11.444 14.5 10.996 14.948 11 15.5C11 16.052 11.448 16.5 12 16.5C12.552 16.5 13 16.052 13 15.5C13 14.948 12.552 14.5 11.996 14.5Z" fill="currentColor"></path></svg></div>
</div>
</div>
<div data-validate="" class="form-field-group">
<label for="message" class="form-label">Message <span class="form-required">*</span></label>
<div class="form-field">
<textarea class="form-input is--textarea w-input" maxlength="5000" name="message" data-name="Message" min="3" placeholder="Hello Osmo, " id="message" required=""></textarea>
<div class="form-field-icon is--success"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path d="M11.25 14.25L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 10.5L11.25 14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12C3 16.9706 7.02943 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02943 16.9706 3 12 3C7.02943 3 3 7.02943 3 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
<div class="form-field-icon is--error"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path opacity="0.1" d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.996 14.5C11.444 14.5 10.996 14.948 11 15.5C11 16.052 11.448 16.5 12 16.5C12.552 16.5 13 16.052 13 15.5C13 14.948 12.552 14.5 11.996 14.5Z" fill="currentColor"></path></svg></div>
</div>
</div>
<div class="form-field-group">
<div class="form-divider"></div>
</div>
<div data-validate="" class="form-field-group">
<div data-radiocheck-group="" class="radiocheck-group">
<label class="w-checkbox radiocheck-field">
<input type="checkbox" name="Terms-Conditions" id="Terms-Conditions" data-name="Terms Conditions" required="" class="w-checkbox-input checkbox-input">
<span class="radiocheck-label is--small w-form-label" for="Terms-Conditions">Accept the Terms and Conditions <span class="form-required">*</span></span>
<div class="radiocheck-custom"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewbox="0 0 24 24" fill="none" class="radiocheck-check-svg"><path d="M7 11.5L10.5 15L17 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
<div class="radiocheck-field-icon is--success"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path d="M11.25 14.25L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 10.5L11.25 14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12C3 16.9706 7.02943 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02943 16.9706 3 12 3C7.02943 3 3 7.02943 3 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
<div class="radiocheck-field-icon is--error"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path opacity="0.1" d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.996 14.5C11.444 14.5 10.996 14.948 11 15.5C11 16.052 11.448 16.5 12 16.5C12.552 16.5 13 16.052 13 15.5C13 14.948 12.552 14.5 11.996 14.5Z" fill="currentColor"></path></svg></div>
</label>
</div>
</div>
<div class="form-field-group">
<div class="form-field">
<div data-submit="" tabindex="0" class="form-submit-btn">
<p class="form-submit-btn-p">Submit</p>
<input type="submit" data-wait="Please wait..." class="form-submit w-button" value="Submit">
</div>
</div>
</div>
</form>
<div class="form-notifcation w-form-done">
<div class="form-notification-bg"></div>
<div class="form-notification-p">Success! We’ll be in touch soon.</div>
<div class="form-notification-icon"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path d="M11.25 14.25L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 10.5L11.25 14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12C3 16.9706 7.02943 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02943 16.9706 3 12 3C7.02943 3 3 7.02943 3 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
</div>
<div class="form-notifcation is--error w-form-fail">
<div class="form-notification-bg"></div>
<div class="form-notification-p">Something went wrong while submitting.</div>
<div class="form-notification-icon"><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none"><path opacity="0.1" d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.996 14.5C11.444 14.5 10.996 14.948 11 15.5C11 16.052 11.448 16.5 12 16.5C12.552 16.5 13 16.052 13 15.5C13 14.948 12.552 14.5 11.996 14.5Z" fill="currentColor"></path></svg></div>
</div>
</div>
```

## CSS

```css
.form-group {
grid-column-gap: 1.5em;
grid-row-gap: 1.5em;
flex-flow: column;
width: 25em;
margin-bottom: 0;
display: flex;
}

.form {
grid-column-gap: 1.5em;
grid-row-gap: 1.5em;
flex-flow: column;
width: 100%;
display: flex;
}

.form-field-group {
grid-column-gap: .75em;
grid-row-gap: .75em;
flex-flow: column;
align-items: flex-start;
display: flex;
}

.form-field {
width: 100%;
position: relative;
}

.form-label {
color: #131313;
width: 100%;
margin-bottom: 0;
font-size: .875em;
font-weight: 500;
line-height: 1;
}

.form-required {
color: #ff4c24;
}

.form-input {
outline-offset: 0px;
color: #131313;
-webkit-appearance: none;
appearance: none;
box-sizing: border-box;
vertical-align: middle;
background-color: #efeeec;
border: 1px solid #efeeec;
border-radius: .328125em;
outline: 0 #0000;
height: auto;
margin-bottom: 0;
padding: .9em 3.5em .9em 1em;
font-size: 1.125em;
font-weight: 500;
line-height: 1.2;
box-shadow: 0 0 #0000;
}

.form-input.is--textarea {
resize: vertical;
min-height: 9em;
}

.form-input:focus {
border-color: #cbc8c5;
}

.form-input::placeholder {
color: #1313134d;
background-color: #efeeec;
}

.form-field-icon {
opacity: 0;
pointer-events: none;
color: #cbc8c5;
-webkit-user-select: none;
user-select: none;
border-radius: .375em;
justify-content: center;
align-items: center;
width: 3.5em;
max-height: 3.5em;
padding-left: 1em;
padding-right: 1em;
display: flex;
position: absolute;
top: 1px;
bottom: 1px;
right: 1px;
}

.form-field-icon.is--error {
color: #ff4c24;
}

.form-field-icon.is--select {
right: 1.75em;
}

.radio-dot {
color: inherit;
background-color: currentColor;
border-radius: 50%;
width: .375em;
height: .375em;
}

.radiocheck-field-icon {
opacity: 0;
pointer-events: none;
color: #cbc8c5;
-webkit-user-select: none;
user-select: none;
border-radius: .375em;
justify-content: center;
align-items: center;
width: 3.5em;
max-height: 3.5em;
padding-left: 1em;
padding-right: 1em;
display: flex;
position: absolute;
top: 1px;
right: 1px;
}

.radiocheck-field-icon.is--error {
color: #ff4c24;
}

.radiocheck-label {
color: #131313;
cursor: pointer;
flex-grow: 1;
margin-bottom: 0;
padding-left: 1.8em;
font-size: 1.125em;
font-weight: 500;
line-height: 1.2;
}

.radiocheck-label.is--small {
flex-grow: 1;
padding-left: 2em;
font-size: 1em;
}

.radiocheck-group {
grid-column-gap: .75em;
grid-row-gap: .75em;
flex-flow: column;
width: 100%;
display: flex;
position: relative;
}

.checkbox-input {
cursor: pointer;
width: 0;
height: 0;
margin-top: 0;
margin-left: 0;
position: absolute;
}

.form-field-chevron {
pointer-events: none;
color: #131313;
-webkit-user-select: none;
user-select: none;
border-radius: .375em;
justify-content: center;
align-items: center;
width: 3.5em;
max-height: 3.5em;
padding-left: 1em;
padding-right: 1em;
display: flex;
position: absolute;
top: 1px;
bottom: 1px;
right: 1px;
}

.form-inactive-text {
opacity: .35;
margin-left: auto;
padding-left: .5em;
}

.radiocheck-field {
align-items: flex-start;
margin-bottom: 0;
padding-left: 0;
display: flex;
position: relative;
}

.radio-input {
cursor: pointer;
width: 0;
height: 0;
margin-top: 0;
margin-left: 0;
position: absolute;
}

.radiocheck-custom {
pointer-events: none;
color: #efeeec;
-webkit-user-select: none;
user-select: none;
background-color: #efeeec;
border: 1px solid #131313;
border-radius: .125em;
order: -1;
justify-content: center;
align-items: center;
width: 1.25em;
height: 1.25em;
margin-top: .066em;
margin-right: .75em;
display: flex;
position: absolute;
}

.radiocheck-check-svg {
width: 1.5em;
position: absolute;
}

.radiocheck-custom.is--radio {
border-radius: 50%;
}

.form-submit {
visibility: hidden;
opacity: 0;
position: absolute;
inset: 0;
}

.form-submit-btn {
outline-offset: 0px;
color: #efeeec;
cursor: pointer;
background-color: #131313;
border: 1px solid #131313;
border-radius: .375rem;
outline: 0 #0000;
flex-flow: row;
justify-content: flex-start;
align-items: center;
padding: 1.005em 1.125em;
display: flex;
position: relative;
overflow: hidden;
box-shadow: inset 0 0 #0000;
}

.form-submit-btn:focus {
outline-offset: 0px;
border-width: 1px;
border-color: #cbc8c5;
outline-color: #131313;
}

.form-submit-btn-p {
margin-bottom: 0;
font-size: 1.125em;
font-weight: 500;
line-height: 1.2;
}

.form-divider {
opacity: .15;
background-color: #131313;
width: 100%;
height: 1px;
}

.form-notifcation {
outline-offset: 0px;
color: #0ba954;
text-align: left;
border: 1px solid #0ba954;
border-color: inherit;
background-color: #efeeec;
border-radius: .375rem;
outline: 0 #0000;
width: 100%;
padding: 1.125em;
font-size: 1em;
position: relative;
}

.form-notifcation.is--error {
color: #ff4c24;
margin-top: 0;
padding-right: 3.5em;
}

.form-notification-icon {
pointer-events: none;
color: inherit;
justify-content: center;
align-items: center;
width: 3.5em;
padding-left: 1em;
padding-right: 1em;
display: flex;
position: absolute;
top: 50%;
right: 0;
transform: translateY(-50%);
}

.form-notification-bg {
opacity: .1;
pointer-events: none;
color: inherit;
background-color: currentColor;
border-radius: calc(.375rem - 2px);
display: flex;
position: absolute;
inset: 0;
}

.form-notification-p {
color: inherit;
font-size: 1.125em;
font-weight: 500;
}

@media screen and (max-width: 767px) {
.form-group {
width: 100%;
}
}

/* Field: Error */
[data-validate].is--error input,
[data-validate].is--error textarea,
[data-validate].is--error select{
border-color: #FF4C24;
}

[data-validate].is--error .form-field-icon.is--error,
[data-validate].is--error .radiocheck-field-icon.is--error{
opacity: 1;
}

/* Field: Success */
[data-validate].is--success .form-field-icon.is--success,
[data-validate].is--success .radiocheck-field-icon.is--success{
opacity: 1;
}

/* Field: Custom Radio or Checkbox */
[data-form-validate] .radiocheck-field input:focus-visible ~ .radiocheck-custom {
background-color: #D0CFCD;
color: #E2E1DF;
}

[data-form-validate] .radiocheck-field input:focus-visible:checked ~ .radiocheck-custom,
[data-form-validate] .radiocheck-field input:checked ~ .radiocheck-custom {
background-color: #131313;
color: #EFEEEC;
}

[data-form-validate] .radiocheck-field .radiocheck-label.is--small {
margin-top: 0.125em;
}

[data-validate].is--error .radiocheck-custom {
border-color: #FF4C24;
}

[data-validate].is--error input:checked ~ .radiocheck-custom {
border-color: #131313;
}

/* Field: Select */
[data-form-validate] select:has(option[value=""]:checked) {
color: rgba(19, 19, 19, 0.3);
}
```

## JavaScript

```javascript
function initAdvancedFormValidation() {
const forms = document.querySelectorAll('[data-form-validate]');

forms.forEach((formContainer) => {
const startTime = new Date().getTime();

const form = formContainer.querySelector('form');
if (!form) return;

const validateFields = form.querySelectorAll('[data-validate]');
const dataSubmit = form.querySelector('[data-submit]');
if (!dataSubmit) return;

const realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
if (!realSubmitInput) return;

function isSpam() {
const currentTime = new Date().getTime();
return currentTime - startTime < 5000;
}

// Disable select options with invalid values on page load
validateFields.forEach(function (fieldGroup) {
const select = fieldGroup.querySelector('select');
if (select) {
const options = select.querySelectorAll('option');
options.forEach(function (option) {
if (
option.value === '' ||
option.value === 'disabled' ||
option.value === 'null' ||
option.value === 'false'
) {
option.setAttribute('disabled', 'disabled');
}
});
}
});

function validateAndStartLiveValidationForAll() {
let allValid = true;
let firstInvalidField = null;

validateFields.forEach(function (fieldGroup) {
const input = fieldGroup.querySelector('input, textarea, select');
const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
if (!input && !radioCheckGroup) return;

if (input) input.__validationStarted = true;
if (radioCheckGroup) {
radioCheckGroup.__validationStarted = true;
const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
inputs.forEach(function (input) {
input.__validationStarted = true;
});
}

updateFieldStatus(fieldGroup);

if (!isValid(fieldGroup)) {
allValid = false;
if (!firstInvalidField) {
firstInvalidField = input || radioCheckGroup.querySelector('input');
}
}
});

if (!allValid && firstInvalidField) {
firstInvalidField.focus();
}

return allValid;
}

function isValid(fieldGroup) {
const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
if (radioCheckGroup) {
const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
const checkedInputs = radioCheckGroup.querySelectorAll('input:checked');
const min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
const max = parseInt(radioCheckGroup.getAttribute('max')) || inputs.length;
const checkedCount = checkedInputs.length;

if (inputs[0].type === 'radio') {
return checkedCount >= 1;
} else {
if (inputs.length === 1) {
return inputs[0].checked;
} else {
return checkedCount >= min && checkedCount <= max;
}
}
} else {
const input = fieldGroup.querySelector('input, textarea, select');
if (!input) return false;

let valid = true;
const min = parseInt(input.getAttribute('min')) || 0;
const max = parseInt(input.getAttribute('max')) || Infinity;
const value = input.value.trim();
const length = value.length;

if (input.tagName.toLowerCase() === 'select') {
if (
value === '' ||
value === 'disabled' ||
value === 'null' ||
value === 'false'
) {
valid = false;
}
} else if (input.type === 'email') {
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
valid = emailPattern.test(value);
} else {
if (input.hasAttribute('min') && length < min) valid = false;
if (input.hasAttribute('max') && length > max) valid = false;
}

return valid;
}
}

function updateFieldStatus(fieldGroup) {
const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
if (radioCheckGroup) {
const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
const checkedInputs = radioCheckGroup.querySelectorAll('input:checked');

if (checkedInputs.length > 0) {
fieldGroup.classList.add('is--filled');
} else {
fieldGroup.classList.remove('is--filled');
}

const valid = isValid(fieldGroup);

if (valid) {
fieldGroup.classList.add('is--success');
fieldGroup.classList.remove('is--error');
} else {
fieldGroup.classList.remove('is--success');
const anyInputValidationStarted = Array.from(inputs).some(input => input.__validationStarted);
if (anyInputValidationStarted) {
fieldGroup.classList.add('is--error');
} else {
fieldGroup.classList.remove('is--error');
}
}
} else {
const input = fieldGroup.querySelector('input, textarea, select');
if (!input) return;

const value = input.value.trim();

if (value) {
fieldGroup.classList.add('is--filled');
} else {
fieldGroup.classList.remove('is--filled');
}

const valid = isValid(fieldGroup);

if (valid) {
fieldGroup.classList.add('is--success');
fieldGroup.classList.remove('is--error');
} else {
fieldGroup.classList.remove('is--success');
if (input.__validationStarted) {
fieldGroup.classList.add('is--error');
} else {
fieldGroup.classList.remove('is--error');
}
}
}
}

validateFields.forEach(function (fieldGroup) {
const input = fieldGroup.querySelector('input, textarea, select');
const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

if (radioCheckGroup) {
const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
inputs.forEach(function (input) {
input.__validationStarted = false;

input.addEventListener('change', function () {
requestAnimationFrame(function () {
if (!input.__validationStarted) {
const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
const min = parseInt(radioCheckGroup.getAttribute('min')) || 1;

if (checkedCount >= min) {
input.__validationStarted = true;
}
}

if (input.__validationStarted) {
updateFieldStatus(fieldGroup);
}
});
});

input.addEventListener('blur', function () {
input.__validationStarted = true;
updateFieldStatus(fieldGroup);
});
});
} else if (input) {
input.__validationStarted = false;

if (input.tagName.toLowerCase() === 'select') {
input.addEventListener('change', function () {
input.__validationStarted = true;
updateFieldStatus(fieldGroup);
});
} else {
input.addEventListener('input', function () {
const value = input.value.trim();
const length = value.length;
const min = parseInt(input.getAttribute('min')) || 0;
const max = parseInt(input.getAttribute('max')) || Infinity;

if (!input.__validationStarted) {
if (input.type === 'email') {
if (isValid(fieldGroup)) input.__validationStarted = true;
} else {
if (
(input.hasAttribute('min') && length >= min) ||
(input.hasAttribute('max') && length <= max)
) {
input.__validationStarted = true;
}
}
}

if (input.__validationStarted) {
updateFieldStatus(fieldGroup);
}
});

input.addEventListener('blur', function () {
input.__validationStarted = true;
updateFieldStatus(fieldGroup);
});
}
}
});

dataSubmit.addEventListener('click', function () {
if (validateAndStartLiveValidationForAll()) {
if (isSpam()) {
alert('Form submitted too quickly. Please try again.');
return;
}
realSubmitInput.click();
}
});

form.addEventListener('keydown', function (event) {
if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
event.preventDefault();
if (validateAndStartLiveValidationForAll()) {
if (isSpam()) {
alert('Form submitted too quickly. Please try again.');
return;
}
realSubmitInput.click();
}
}
});
});
}

// Initialize Advanced Form Validation
document.addEventListener('DOMContentLoaded', () => {
initAdvancedFormValidation();
});
```

## Implementation

### Required structure

- Add `data-form-validate` to the outer form wrapper.
- Keep the actual `<form>` element inside that wrapper.
- Add `data-validate` to each field group you want validated.

### Field rules

- Text and textarea fields support character limits via `min` and `max`.
- Email fields are validated automatically with an email pattern.
- Select fields treat empty and invalid placeholder values as invalid.
- Radio and checkbox groups use `data-radiocheck-group`.

### Radio and checkbox groups

- Use `data-radiocheck-group` on the group container.
- Optional `min` and `max` control how many checkboxes must be selected.
- Radio groups require at least one checked input.

### Live validation behavior

- Validation updates on `input`, `change`, and `blur`.
- Error styling starts only after a field has been interacted with.
- Grouped inputs start visual validation once interaction begins.

### State classes

- `.is--error`: field is invalid.
- `.is--success`: field is valid.
- `.is--filled`: field has a value or a checked option.

### Submit handling

- Wrap your custom button with `data-submit`.
- Keep a real `<input type="submit">` inside it.
- The script validates first, then triggers the real submit input.

### Keyboard behavior

- Pressing `Enter` in non-textarea fields triggers the same custom submit flow.
- `Enter` in `<textarea>` remains available for new lines.

### Anti-spam safeguard

- Submissions within 5 seconds of page load are blocked.
- This helps reduce instant bot submissions.

### Related

- If you need a lighter version, use the basic live validation setup.
