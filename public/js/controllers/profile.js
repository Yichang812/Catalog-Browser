'use strict';

angular.module('ace.users')
.controller('ProfileController', ['$scope', '$rootScope', 'Global', 'UsersAPI', 'navBarMenu', function ($scope, $rootScope, Global, UsersAPI, navBarMenu) {

        $scope.global = Global;
        $scope.username = Global.user.name;
        $scope.codeNameInput =
            {value:'',
            valid:{valid:true,lengthCheck: true, patternCheck:true},
            minLength:1,
            maxLength:30,
            pattern:/^\s*\w*\s*$/ };
        $scope.email = Global.user.email;
        $scope.editable = false;
        $scope.userPrdtList = Global.user.userPrdt;
        $scope.userPrdtListCopy = angular.copy($scope.userPrdtList);
        $scope.prdtList = Global.prdtList;
        $scope.defPrdtName = Global.user.userDefPrdt;
        $scope.defPrdtNameCopy = angular.copy($scope.defPrdtName);
        $scope.menu = navBarMenu;

        // set value for default product dropdown selection
        $('#defProductField').html($scope.defPrdtName+' <span class="caret"></span>');

        $scope.updateDefPrdtField = function(updateName) {
            $scope.defPrdtName = updateName;
            $('#defProductField').html($scope.defPrdtName+' <span class="caret"></span>');
        };

        $scope.validateDefPrdtField = function() {
            $scope.defPrdtName = 'Select default product';
            $('#defProductField').html($scope.defPrdtName+' <span class="caret"></span>');
        };

        $scope.updateUserPrdt = function () {
            if (!angular.equals($scope.userPrdtList, $scope.userPrdtListCopy)) {
                UsersAPI.updateUserPrdt.save({userPrdt:$scope.userPrdtList}, Global.user, function() {
                    Global.user.userPrdt = $scope.userPrdtList;
                    $scope.userPrdtListCopy = angular.copy($scope.userPrdtList);
                });
            }
        };

        $scope.updateUserDefPrdt = function () {
            if ($scope.userPrdtList.length === 1) {
                $scope.defPrdtName = $scope.userPrdtList[0].toString();
            }
            if (!angular.equals($scope.defPrdtName, $scope.defPrdtNameCopy)) {
                UsersAPI.updateUserDefPrdt.update({userDefPrdt:$scope.defPrdtName}, Global.user, function() {
                    Global.user.userDefPrdt = $scope.defPrdtName;
                    $scope.defPrdtNameCopy = angular.copy($scope.defPrdtName);
                });
            }
            $scope.menu = navBarMenu.useDefault($scope.defPrdtName);
        };

        $scope.toggleEdit = function(){
            if (!$scope.editable)
                $scope.editable = true;
            else {
                if ($scope.defPrdtName && $scope.defPrdtName !== 'Select default product') {
                    $('#submitEmptyAlert').slideUp(300);
                    $scope.editable= false;
                }
                else {
                    if ($scope.defPrdtName === 'Select default product')
                        $scope.submitEmptyMsg = 'Please select a default product to continue.';
                    if (!$scope.defPrdtName || $scope.userPrdtList.length === 0)
                        $scope.submitEmptyMsg = 'Please select a product to continue.';
                    $('#submitEmptyAlert').slideDown(300);
                }
            }
        };

        $scope.updateCodeName = function(){
            $scope.toggleEdit();
            UsersAPI.profile.update({codeName:$scope.codeNameInput.value}, Global.user, function(){
                Global.user.codeName = $scope.codeNameInput.value;
                Global.user.isManufacturer = false;
                $scope.setCodeName();
                $rootScope.$broadcast('changeUserStatus');
            });
        };

        $scope.checkValid = function(){
            $scope.codeNameInput.valid.lengthCheck = $scope.codeNameInput.value.length >= $scope.codeNameInput.minLength && $scope.codeNameInput.value.length <= $scope.codeNameInput.maxLength ;
            $scope.codeNameInput.valid.patternCheck= $scope.codeNameInput.pattern.test($scope.codeNameInput.value);
            $scope.codeNameInput.valid.valid = $scope.codeNameInput.valid.lengthCheck && $scope.codeNameInput.valid.patternCheck;
        };

        $scope.setCodeName = function(){
            $scope.codename = (Global.user.codeName === null) ? 'Not Assigned' : (Global.user.isManufacturer ? Global.user.codeName : Global.user.codeName + ' (pending)');
        };
        $scope.setCodeName();

    }])
;