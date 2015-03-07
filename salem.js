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
			var isLeftClick = function (clickEvent) {
				return clickEvent && clickEvent.which === 1;
			}
			var isRightClick = function (clickEvent) {
				return clickEvent && clickEvent.which === 3;
			}

			var initializePlayers = function () {
				$scope.playerBeingEdited = null;
				$scope.players = _.map(_.range(0, 15), function (number) {
					return {
						number: number,
						isSuspicious: false,
						votes: {},
						nominations: {},
						alignment: null
					};
				});
			};

      $scope.alignmentMode = false;

      $scope.toggleAlignmentMode = function (event) {
        // if it's a right click
        if (event.which === 3) {
          $scope.alignmentMode = !$scope.alignmentMode;
					initializePlayers();
        }
      };

			// Set the player being edited to the given player,
			// or exit edit mode if the player being edited has
			// their edit button clicked again.
			var editPlayer = function (player) {
				if (player !== $scope.playerBeingEdited) {
					$scope.playerBeingEdited = player;
				} else {
					$scope.playerBeingEdited = null;
				}
			};

			var markPlayerAsDead = function (player) {
				player.isDead = !player.isDead;
			};
			
			var markPlayerAlignment = function (player, alignment) {
				if (player.alignment !== alignment) {
					player.alignment = alignment;
				} else {
					player.alignment = null;
				}
			}

			this.actOnPlayer = function (clickEvent, player) {
				// Left click
				if (isLeftClick(clickEvent)) {
					editPlayer(player);
				}
				// Right click
				else if (isRightClick(clickEvent)) {
					markPlayerAsDead(player);
				}
			}

			this.markVote = function (clickEvent, votingPlayer, accusedPlayer) {
				// Players can't vote on themselves, so replace that with
				// the ability to mark that player as good or bad
				if (votingPlayer === accusedPlayer) {
					return markPlayerAlignment(accusedPlayer, 'town');
				}
				
				if (isLeftClick(clickEvent)) {
					votingPlayer.votes[accusedPlayer.number] = votingPlayer.votes[accusedPlayer.number] !== 'guilty' ? 'guilty': null;
				}
				else if (isRightClick(clickEvent)) {
					votingPlayer.votes[accusedPlayer.number] = votingPlayer.votes[accusedPlayer.number] !== 'innocent' ? 'innocent': null;
				}
				console.log('voting player votes', votingPlayer.votes);
			}

			this.markNomination = function (playerBeingNominated, nominator) {
				// Players can't vote on themselves, so replace that with
				// the ability to mark that player as good or bad
				if (playerBeingNominated === nominator) {
					return markPlayerAlignment(nominator, 'mafia');
				}
				playerBeingNominated.nominations[nominator.number] = !playerBeingNominated.nominations[nominator.number];
			}
			
			initializePlayers();
    }])


    // Add the widgets to the page then Bootstrap the app
    var roleStrikerWidget = $(
        '<div class="role-striker-container" ng-controller="roleStriker as playerController" ng-class="{\'alignment-mode\': alignmentMode}">' +
          '<div class="drag-handle" ng-mousedown="toggleAlignmentMode($event)"></div>' +
          '<div class="players">' +
            '<div class="player" ng-repeat="player in players" ng-class="{\'editable\': playerBeingEdited !== null, \'player-being-edited\': player === playerBeingEdited, \'is-dead\': player.isDead, \'is-suspicious\': player.isSuspicious, \'is-town\': player.alignment === \'town\', \'is-mafia\': player.alignment === \'mafia\'}">' +
							'<div class="player-control nomination" ng-class="{\'is-nominating\': playerBeingEdited.nominations[player.number]}" ng-click="playerController.markNomination(playerBeingEdited, player)"></div>' +
							'<div class="player-control vote" ng-class="{\'guilty\': playerBeingEdited.votes[player.number] == \'guilty\', \'innocent\': playerBeingEdited.votes[player.number] == \'innocent\'}" ng-mousedown="playerController.markVote($event, playerBeingEdited, player)"></div>' +
							'<div class="player-control player-number" ng-mousedown="playerController.actOnPlayer($event, player)"></div>' +
              '<div class="player-read" ng-click="player.isSuspicious = !player.isSuspicious"></div>' +
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
        href: 'http://true-reality.net/cdn/intuition.css'
        // href: 'http://localhost:8777/intuition.css'
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
