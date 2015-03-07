// ========================
// = WARNING: HACKTACULAR =
// ========================

(function () {
  'use strict';

  // Clear any existing widgets
  $('.intuition-application').remove();

  var setUp = function () {
    window.intuitionApplicationInitialized = true;

    angular.module('intuition', [])

    .controller('roleStriker', ['$scope', function ($scope) {
      $scope.roles = _.range(0, 15);

      $scope.alignmentMode = false;

      $scope.toggleAlignmentMode = function (event) {
        // if it's a right click
        if (event.which === 3) {
          $scope.alignmentMode = !$scope.alignmentMode;
          $scope.$broadcast('resetReads');
        }
      };
    }])

    // Read as in "My read on that player is that he's the Jester"
    .controller('playerRead', ['$scope', function ($scope) {
      var potentialReads = ['innocent', 'unknown', 'suspicious', 'guilty'];
      var rolesForRead = {
        'innocent': [
          'BG', 'DOC', 'ESC', 'INV', 'JLR', 'LOO',
          'MAY', 'MDM', 'RET', 'SHF', 'SPY', 'TRA',
          'VET', 'VIG'
        ],
        'unknown': [],
        'suspicious': [
          'AMN', 'RSO', 'EXE', 'JES', 'SK', 'SVR', 'WW', 'WIT'
        ],
        'guilty': [
          'BLA', 'CSG', 'CNS', 'DIS', 'FRA', 'GF', 'JAN', 'MAF'
        ]
      };
      
      
      $scope.read = 'unknown';
      $scope.role = null;
      
      $scope.$on('resetReads', function () {
        $scope.read = 'unknown';
        $scope.role = null;
      });

      $scope.changeRead = function (event) {
        console.log('click event log', event.which);
        // left click goes leftward through the potential reads, right click
        // goes rightward
        var currentReadNumber = _.indexOf(potentialReads, $scope.read);
        if (event.which === 1) {
          $scope.read = potentialReads[(currentReadNumber + 1) % potentialReads.length];
        } else if (event.which === 3) {
          // If we're about to go negative, preemptively wrap around to the
          // max
          if (currentReadNumber === 0) {
            currentReadNumber = potentialReads.length;
          }
          $scope.read = potentialReads[(currentReadNumber - 1) % potentialReads.length];
        }
        // Clear the role whenever the read changes, since it may not be valid
        // for the new read
        $scope.role = null;
      };
      
      $scope.getRolesForRead = function (read) {
        return rolesForRead[read];
      };
    }]);

    // Add the widgets to the page then Bootstrap the app
    var roleStrikerWidget = $(
        '<div class="role-striker-container" ng-controller="roleStriker" ng-class="{\'alignment-mode\': alignmentMode}">' +
          '<div class="drag-handle" ng-mousedown="toggleAlignmentMode($event)"></div>' +
          '<div class="role-names">' +
            '<div class="role-name" ng-controller="playerRead" ng-repeat="role in roles">' +
              '<div class="role-guess">' +
                '<div class="role-guess-label" ng-class="\'role-guess-label-\' + read">{{role}}</div>' +
                '<select class="role-guess-picker" ng-options="role for role in getRolesForRead(read)" ng-model="role"></select>' +
              '</div>' +
              '<div class="read" ng-class="\'read-\' + read" ng-mousedown="changeRead($event)"></div>' +
            '</div>' +
          '</div>' +
        '</div>'
    );

    var application = $('<div />', {
      'class': 'intuition-application'
    });

    application.append(roleStrikerWidget);

    $(document.body).append(application);

    // Bootstrap angular onto the widget
    angular.bootstrap(application, ['intuition']);

    // OLD SHIT
    // ================================

    $(document.body).attr('oncontextmenu', 'return false;');

    // Style the widget
    $('.role-striker-container').css({
      position: 'absolute',
      top: parseFloat(window.localStorage.getItem('containerTop'), 10) || 0,
      left: parseFloat(window.localStorage.getItem('containerLeft'), 10) || 0,
      width: parseFloat(window.localStorage.getItem('containerWidth'), 10) || 80,
      height: parseFloat(window.localStorage.getItem('containerHeight'), 10) || 200,
    }).draggable({
      'handle': '.drag-handle',
      'stop': function() {
        window.localStorage.setItem('containerTop', $(this).offset().top);
        window.localStorage.setItem('containerLeft', $(this).offset().left);
      }
    }).resizable({
      'stop': function() {
        window.localStorage.setItem('containerWidth', $(this).width());
        window.localStorage.setItem('containerHeight', $(this).height());
      }
    });
  };

  if (!window.intuitionApplicationInitialized) {
    // Load the libraries and initialize
    $.getScript('https://code.jquery.com/ui/1.11.2/jquery-ui.min.js', function () {
      $('<link/>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://code.jquery.com/ui/1.11.2/themes/black-tie/jquery-ui.css'
      }).appendTo('head');
      $('<link/>', {
        rel: 'stylesheet',
        type: 'text/css',
        // TODO: CHANGE BEFORE LOCAL DEV!!!!!!!!!!!!!!!!!
        // href: 'http://true-reality.net/cdn/intuition.css'
        href: 'http://localhost:8777/intuition.css'
      }).appendTo('head');

      // Kick it off
      $.getScript('https://ajax.googleapis.com/ajax/libs/angularjs/1.3.11/angular.min.js',
          function () {
            $.getScript('https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js',
                setUp);
          }
      );
    });
  } else {
    setUp();
  }
}());
