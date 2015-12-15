'use strict';

angular.module('ace.users').controller('UsersController', ['$scope', '$routeParams', '$location', 'Global', 'UsersAPI', '$modal', function ($scope, $routeParams, $location, Global, UsersAPI, $modal) {

        $scope.global = Global;
        $scope.show = {};
        $scope.show.Man = false;
        $scope.show.User = false;
        $scope.page_limit = 15;
        $scope.current_page = 1;
        $scope.query = {};
        $scope.update = function(id) {
            var users = $scope.users;
            var index = 0;
            for(var i in users)
            {
                if(users[i]._id === id)
                {
                    index = i;
                    break;
                }
            }
            if(!users[index].codeName)
            {
                $modal.open({
                    templateUrl: 'views/errorAlertModal.html',
                    controller: 'errorAlertModalCtrl',
                    resolve: {
                        message: function() {
                            return 'The user needs to have a codename before he can be promoted to a manufacturer.';
                        }
                    }
                });
                return;
            }
            UsersAPI.userlist.update({userId: id}, function(user) {
                users[index] = user;
                if(user._id === Global.user._id){
                    Global.user.codeName = user.codeName;
                    Global.user.isManufacturer = user.isManufacturer;
                }
                $scope.users[i].name += ($scope.users[i].codeName ===null) ? '': ' ('+$scope.users[i].codeName+')';

            });
        };

        $scope.find = function(start) {
            UsersAPI.userlist.getall({lowerLimit: ($scope.current_page - 1)*$scope.page_limit, limit: $scope.page_limit, count: false, showUsers: $scope.show.User, showMan: $scope.show.Man, search: $scope.query.name},function(users) {
                $scope.users = users.users;
                for (var i = 0; i < $scope.users.length; i++)
                    $scope.users[i].name += ($scope.users[i].codeName ===null) ? '': ' ('+$scope.users[i].codeName+')';
                if(!start)
                    return;
                if(users.users.length === $scope.page_limit)
                {
                    UsersAPI.userlist.getall({count: true, onlyUsers: $scope.show.User, onlyMan: $scope.show.Man, search: $scope.query.name},function(count){
                        $scope.total = count.count;
                    });
                }
                else
                {
                    $scope.total = users.users.length;
                }
            });
        };

        $scope.$watch('show', function() {
            $scope.find();
        }, true);


    }]);