angular.module('tubenotes.groupVids', [])

.controller('GroupVidsController', function($location, $scope, GroupHandler, AppFactory) {
  $scope.group = GroupHandler.currentGroup;
  $scope.groupVids = [];
  $scope.isLoggedIn = function() {
    return AppFactory.username !== '';
  };

  $scope.joinGroup = function() {
    GroupHandler.joinGroup(GroupHandler.currentGroup.id);
    GroupHandler.groups.push($scope.group);
  };

  $scope.isGroupMember = function() {
    for (var i = 0; i < GroupHandler.groups.length; i++) {
      if (GroupHandler.groups[i].groupname === $scope.group.groupname) {
        return true;
      }
    }
    return false;
  };

  var initializeGroupVids = function() {
    GroupHandler.getGroupVids($scope.group.id)
    .then(function(videos) {
      GroupHandler.currentGroup.videos = videos;
      $scope.groupVids = GroupHandler.currentGroup.videos;
    }).catch(function(err) {
      console.log(err);
    });
  };
  initializeGroupVids();

  $scope.sortPropertyName = 'createdAt';
  $scope.reverse = true;
  $scope.sortBy = function(sortPropertyName) {
    $scope.reverse = ($scope.sortPropertyName === sortPropertyName) ? !$scope.reverse : false;
    $scope.sortPropertyName = sortPropertyName;
  };
});