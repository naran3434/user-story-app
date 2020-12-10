/**
 * AngularJS Tutorial 1
 * @author Nick Kaye <nick.c.kaye@gmail.com>
 */

/**
 * Main AngularJS Web Application
 */
let app = angular.module('kaptasAngularApp', [
  'ngRoute', 'ngStorage'
]);

/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    // Home
    .when("/", {templateUrl: "partials/login.html", controller: "LoginCtrl"})
    // Pages
    .when("/story-create", {templateUrl: "partials/create_story.html", controller: "StoryCtrl"})
    .when("/stories", {templateUrl: "partials/stories.html", controller: "StoryCtrl"})
    .when("/story/:id", {templateUrl: "partials/review_story.html", controller: "StoryCtrl"})

    // else 404
    .otherwise("/404", {templateUrl: "partials/404.html", controller: "LoginCtrl"});
}]);

/**
 * http interceptor to check each request & response error
 * @param $localStorage
 * @param $location
 * @param @q
 */
app.factory('httpRequestInterceptor', function ($localStorage, $location, $q) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if ($localStorage && $localStorage.user && $localStorage.user.token) {
                config.headers.Authorization = $localStorage.user.token;
            }
            return config;
        },
        responseError: function (response) {
            if (response.status === 401 || response.status === 503) {
                delete $localStorage.user;
                $localStorage.isLoggedIn = false;
                $location.path('/');
            }
            return $q.reject(response);
        }
    };
});

/**
 * Add interceptors to http providers
 */
app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('httpRequestInterceptor');
});


/**
 * Configure API calls
 */
app.service('apiService', function($http) {

    // API base url
    const baseUrl = "http://localhost:3000/api/v1/";

    /**
     * Login api
     * @param email
     * @param password
     * @param admin
     */
    this.login = function (email, password, admin) {
      return $http.post(baseUrl + 'signin', {email: email, password: password, isAdmin: admin});
    };

    /**
     * To create Story
     * @param data
     */
    this.store = function (data) {
        return $http.post(baseUrl + 'stories', {...data});
    };

    /**
     * To fetch story list
     */
    this.list = function () {
        return $http.get(baseUrl + 'stories');
    };

    /**
     * To fetch story by it's id
     * @param id
     */
    this.storyById = function (id) {
        return $http.get(baseUrl + 'stories/' + id);
    };

    /**
     * Review the story
     * @param id
     * @param value
     */
    this.review = function (id, value) {
        return $http.put(baseUrl + 'stories/' + id + '/' + value, {});
    }
});

/**
 * Auth Service to store & restore
 */
app.service('authService', function ($localStorage) {

    this.saveState = function (user) {
        $localStorage.user = user;
        $localStorage.isLoggedIn = true;
        $localStorage.$apply();
    };

    this.restoreState = function () {
        return $localStorage.user;
    };

    this.isLoggedIn = function () {
        return $localStorage.isLoggedIn;
    };

    this.isAdmin = function () {
        return $localStorage.user && $localStorage.user.role === 'Admin';
    }
});

/**
 * Set root scope to enable global functions & route change event etc..
 */
app.run(['$rootScope', '$location', 'authService', '$localStorage', function ($rootScope, $location, authService, $localStorage) {
    $rootScope.$on('$routeChangeStart', function (event) {
        if(!$localStorage.isLoggedIn){
            $location.path('/');
        }

        if($location.$$url === '/story-create' && authService.isAdmin()){
            $location.path('/stories');
        }
    });

    $rootScope.logout = function(path) {
        $localStorage.$reset();
        $location.path('/');
    };

    $rootScope.isLoggedIn = function(isAdmin) {
       return isAdmin ? authService.isLoggedIn() && authService.isAdmin() : authService.isLoggedIn();
    };

    $rootScope.restoreState = function() {
        return authService.restoreState();
    };

}]);


/**
 * controls the login page
 */
app.controller('LoginCtrl', function ($scope, $localStorage, $location, apiService, authService) {

  $scope.email = null;
  $scope.password = null;
  $scope.isAdmin = false;

  // restrict only for guest
  if (authService.isLoggedIn()){
    $location.path('/stories');
    return false;
  }

  // To login & navigate to desired page when success
  $scope.login = function () {
    apiService.login($scope.email, $scope.password, $scope.isAdmin).then(function (response) {
        if(response.status === 200){
          const user = response.data;
          authService.saveState(user);
          if(user.role === 'Admin'){
              $location.path('/stories');
          } else {
              $location.path('/story-create');
          }
          return false;
        }
        alert("Oops! Something went wrong, Please try again later");
    }).catch(function (error) {
        console.log(error);
        alert("Oops! Something went wrong, Please try again later");
    });
  };

});

app.controller('StoryCtrl', function ($scope, apiService, $location, $routeParams, authService) {

    // for form data
    $scope.dataForm = {
        summary: '',
        description: '',
        estimatedHrs: '',
        cost: 0,
        type: '',
        complexity: ''
    };

    $scope.storyId = $routeParams.id ? $routeParams.id : 0;
    $scope.stories = [];
    $scope.story = {};

    // master data
    $scope.types = ['enhancement', 'bugfix', 'development', 'QA'];
    $scope.complexity = ['low', 'mid', 'high'];

    // filters & sorting variables
    $scope.filters = {
        typeFilter: ''
    };
    $scope.sort = {
        column: 'id',
        descending: false
    };

    // To create a new story
    $scope.store = function () {
        apiService.store($scope.dataForm).then(function (response) {
            if(response.status === 201){
                alert('Story Created');
                $location.path('/stories');
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    // list of stories
    $scope.list = function () {
        apiService.list().then(function (response) {
            if(response.status === 200){
                $scope.stories = response.data;
            }
        }).catch(function (error) {
        });
    };

    // story details view
    $scope.viewStory = function(id){
        if(authService.isAdmin()){ $location.path('/story/' + id); }
        return false;
    };

    // story detail view data
    $scope.fetchStory = function(){
        if(!authService.isAdmin()){ $location.path('/stories'); }
        apiService.storyById($scope.storyId).then(function (response) {
            if(response.status === 200){
                $scope.story = response.data;
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    // review the story
    $scope.reviewStory = function(value){
        apiService.review($scope.storyId, value).then(function (response) {
            if (response.status === 200){
                alert('Story Updated');
                $location.path('/stories');
            }
        }).catch(function (error) {
        });
    };

    // mark color for story rows
    $scope.statusCls = function(status){
        if(authService.isAdmin()){
            if(status === 'accepted'){ return 'text-success font-weight-600'; }
            if(status === 'rejected'){ return 'text-danger font-weight-600'; }
        }
        return '';
    };

    // sort by class
    $scope.selectedCls = function(column) {
        return column == $scope.sort.column && 'sort-' + $scope.sort.descending;
    };

    // handling sort
    $scope.changeSorting = function(column) {
        let sort = $scope.sort;
        if (sort.column == column) {
            sort.descending = !sort.descending;
        } else {
            sort.column = column;
            sort.descending = false;
        }
    };

});
