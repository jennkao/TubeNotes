angular.module('tubenotes.home', ['angularMoment'])

.controller('HomeController', function($http, $location, $scope, AppFactory, moment, GroupHandler) {
  // Every time search.html is loaded, do a get request to the server's /videos route
  // Make sure username is sent in the get request
  $scope.username = AppFactory.username;
  $scope.userVideos = [];
  $scope.userGroups = [];

  $scope.isLoggedIn = function() {
    return AppFactory.username !== '';
  };
  
  var initializeLibrary = function() {
    return $http({
      method: 'GET',
      url: '/videos',
      params: {username: $scope.username} // this will pass in the username to the request as request.query
    }).then(function(response) {
      // Store the results of the get request in $scope.userVideos
      $scope.userVideos = response.data;
    }).catch(function(err) {
      console.log(err);
    });
  };
  initializeLibrary();

  $scope.sortPropertyName = 'lastCommentDate';
  $scope.reverse = true;
  $scope.sortBy = function(sortPropertyName) {
    $scope.reverse = ($scope.sortPropertyName === sortPropertyName) ? !$scope.reverse : false;
    $scope.sortPropertyName = sortPropertyName;
  };

  var initializeUserGroups = function() {
    GroupHandler.getUserGroups($scope.username)
    .then(function(groups) {
      GroupHandler.groups = groups;
      $scope.userGroups = GroupHandler.groups;
    });
  };
  initializeUserGroups();

  $scope.setCurrentGroup = function(group) {
    GroupHandler.currentGroup = group;
    $location.path('/groupVids');
  };

  $scope.deleteVideo = function(video) {
    AppFactory.deleteVideo(video);
    // $route.reload();
  };

});