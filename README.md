AngularJS user story app
====================

author: [Naran Kumar](https://github.com/naran3434)

**NOTE:  We’re referencing all of our vendor dependencies (e.g. Bootstrap, jQuery, Angular) at outside URLs.  Therefore, it is necessary to host our site while we’re working on it.  Be sure we are viewing it in a browser with http:// -- not file://**

## Summary

The App contains information about what kind of task needs to be performed. The Admin will review the User Story and will also has ability to approve or reject the User story created by the user

## Installation

* Clone the Repo
`git clone url`

* Install http-server globally to run application
`npm install -g angular-http-server`

* Install node dependencies
`npm install`

* Start the server
`npm start`

`Note: Please make sure api server is running`

Great, now you should be able to see the app in `http://localhost:8081`

# Config

- To change API url, please check the `apiService` in `js/main.js`

# Assumptions 
- All the logged user details will be handled in authorization via API for created by / review by
- Admin can able to do only approve/reject
- Admin will not have option to edit any existing fields in the form
  
