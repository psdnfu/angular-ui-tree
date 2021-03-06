(function() {
  'use strict';

  angular.module('ui.tree')

   /**
    * @ngdoc service
    * @name ui.tree.service:$helper
    * @requires ng.$document
    * @requires ng.$window
    *
    * @description
    * angular-ui-tree.
    */
    .factory('$uiTreeHelper', ['$document', '$window', 'treeConfig',
      function ($document, $window, treeConfig) {
        return {

          /**
           * A hashtable used to storage data of nodes
           * @type {Object}
           */
          nodesData: {
          },

          setNodeAttribute: function(scope, attrName, val) {
            if (!scope.$modelValue) {
              return undefined;
            }
            var data = this.nodesData[scope.$modelValue.$$hashKey];
            if (!data) {
              data = {};
              this.nodesData[scope.$modelValue.$$hashKey] = data;
            }
            data[attrName] = val;
          },

          getNodeAttribute: function(scope, attrName) {
            if (!scope.$modelValue) {
              return undefined;
            }
            var data = this.nodesData[scope.$modelValue.$$hashKey];
            if (data) {
              return data[attrName];
            }
            return undefined;
          },

          /**
           * @ngdoc method
           * @methodOf ui.tree.service:$nodrag
           * @param  {Object} targetElm angular element
           * @return {Bool} check if the node can be dragged.
           */
          nodrag: function (targetElm) {
            return (typeof targetElm.attr('nodrag')) != "undefined";
          },

          /**
           * get the event object for touchs
           * @param  {[type]} e [description]
           * @return {[type]}   [description]
           */
          eventObj: function(e) {
            var obj = e;
            if (e.targetTouches !== undefined) {
              obj = e.targetTouches.item(0);
            } else if (e.originalEvent !== undefined && e.originalEvent.targetTouches !== undefined) {
              obj = e.originalEvent.targetTouches.item(0);
            }
            return obj;
          },

          dragInfo: function(node) {
            if (angular.isDefined(node)) {
              return {
                source: node,
                sourceInfo: {
                  nodeScope: node,
                  index: (angular.isFunction(node.index)) ? node.index() : 0,
                  nodesScope: node.$parentNodesScope
                },
                index: (angular.isFunction(node.index)) ? node.index() : 0,
                siblings: (angular.isFunction(node.siblings)) ? node.siblings().slice(0) : [],
                parent: node.$parentNodesScope,

                moveTo: function(parent, siblings, index) { // Move the node to a new position
                  if (parent.accept(node, index) === true)
                  {
                    this.parent = parent;
                    this.siblings = siblings.slice(0);
                    var i = this.siblings.indexOf(this.source); // If source node is in the target nodes

                    if (i > -1) {
                      this.siblings.splice(i, 1);
                      if (this.source.index() < index) {
                        index--;
                      }
                    }

                    this.siblings.splice(index, 0, this.source);
                    this.index = index;

                    return true;
                  }

                  return false;
                },

                parentNode: function() {
                  return this.parent.$nodeScope;
                },

                prev: function() {
                  if (this.index > 0) {
                    return this.siblings[this.index - 1];
                  }
                  return undefined;
                },

                next: function() {
                  if (this.index < this.siblings.length - 1) {
                    return this.siblings[this.index + 1];
                  }
                  return undefined;
                },

                isDirty: function() {
                  return this.source.$parentNodesScope != this.parent ||
                          this.source.index() != this.index;
                },

                eventArgs: function(elements, pos) {
                  return {
                    source: this.sourceInfo,
                    dest: {
                      index: this.index,
                      nodesScope: this.parent
                    },
                    elements: elements,
                    pos: pos
                  };
                },

                apply: function(copy) {
                  var nodeData = this.source.$modelValue;
                  if (!copy) {
                    this.source.remove();
                  }

                  if (angular.isDefined(this.parent))
                  {
                    var data = (copy) ? angular.copy(nodeData) : nodeData;
                    var index = this.index;
                    if (copy && this.sourceInfo.index < this.index && this.sourceInfo.nodesScope === this.parent) {
                      index = this.index + 1;
                    }
                    this.parent.insertNode(index, data);
                  }
                }
              };
            } else {
              return undefined;
            }
          },

          /**
          * @ngdoc method
          * @name hippo.theme#height
          * @methodOf ui.tree.service:$helper
          *
          * @description
          * Get the height of an element.
          *
          * @param {Object} element Angular element.
          * @returns {String} Height
          */
          height: function (element) {
            return element.prop('scrollHeight');
          },

          /**
          * @ngdoc method
          * @name hippo.theme#width
          * @methodOf ui.tree.service:$helper
          *
          * @description
          * Get the width of an element.
          *
          * @param {Object} element Angular element.
          * @returns {String} Width
          */
          width: function (element) {
            return element.prop('scrollWidth');
          },

          /**
          * @ngdoc method
          * @name hippo.theme#offset
          * @methodOf ui.nestedSortable.service:$helper
          *
          * @description
          * Get the offset values of an element.
          *
          * @param {Object} element Angular element.
          * @returns {Object} Object with properties width, height, top and left
          */
          offset: function (element) {
            var boundingClientRect = element[0].getBoundingClientRect();

            return {
                width: element.prop('offsetWidth'),
                height: element.prop('offsetHeight'),
                top: boundingClientRect.top + ($window.pageYOffset || $document[0].body.scrollTop || $document[0].documentElement.scrollTop),
                left: boundingClientRect.left + ($window.pageXOffset || $document[0].body.scrollLeft  || $document[0].documentElement.scrollLeft)
              };
          },

          /**
          * @ngdoc method
          * @name hippo.theme#positionStarted
          * @methodOf ui.tree.service:$helper
          *
          * @description
          * Get the start position of the target element according to the provided event properties.
          *
          * @param {Object} e Event
          * @param {Object} target Target element
          * @returns {Object} Object with properties offsetX, offsetY, startX, startY, nowX and dirX.
          */
          positionStarted: function (e, target) {
            var pos = {};
            pos.offsetX = e.pageX - this.offset(target).left;
            pos.offsetY = e.pageY - this.offset(target).top;
            pos.startX = pos.lastX = e.pageX;
            pos.startY = pos.lastY = e.pageY;
            pos.nowX = pos.nowY = pos.distX = pos.distY = pos.dirAx = 0;
            pos.dirX = pos.dirY = pos.lastDirX = pos.lastDirY = pos.distAxX = pos.distAxY = 0;
            return pos;
          },

          positionMoved: function (e, pos, firstMoving) {
            // mouse position last events
            pos.lastX = pos.nowX;
            pos.lastY = pos.nowY;

            // mouse position this events
            pos.nowX  = e.pageX;
            pos.nowY  = e.pageY;

            // distance mouse moved between events
            if (treeConfig.dir == 'rtl') {
              pos.distX = pos.nowX - pos.lastX;
            } else {
              pos.distY = pos.nowY - pos.lastY;
            }

            // direction mouse was moving
            pos.lastDirX = pos.dirX;
            pos.lastDirY = pos.dirY;

            // direction mouse is now moving (on both axis)
            pos.dirX = pos.distX === 0 ? 0 : pos.distX > 0 ? 1 : -1;
            pos.dirY = pos.distY === 0 ? 0 : pos.distY > 0 ? 1 : -1;

            // axis mouse is now moving on
            var newAx   = Math.abs(pos.distX) > Math.abs(pos.distY) ? 1 : 0;

            // do nothing on first move
            if (firstMoving) {
              pos.dirAx  = newAx;
              pos.moving = true;
              return;
            }

            // calc distance moved on this axis (and direction)
            if (pos.dirAx !== newAx) {
              pos.distAxX = 0;
              pos.distAxY = 0;
            } else {
              pos.distAxX += Math.abs(pos.distX);
              if (pos.dirX !== 0 && pos.dirX !== pos.lastDirX) {
                pos.distAxX = 0;
              }

              pos.distAxY += Math.abs(pos.distY);
              if (pos.dirY !== 0 && pos.dirY !== pos.lastDirY) {
                pos.distAxY = 0;
              }
            }

            pos.dirAx = newAx;
          },

          findIntersect: function(elmPos, nodes, collideWith, direction, horizontal) {
            var self = this;
            var intersectWith;
            for (var nodeIdx = 0; nodeIdx < nodes.length; nodeIdx++) {
              var intersectWithChild;
              var nodeElement = angular.element(nodes[nodeIdx]);

              if (angular.isDefined(nodeElement[0])) {
                if (nodeElement.hasClass('angular-ui-tree-node')) {
                  intersectWithChild = self.findIntersect(elmPos, nodeElement.children(), collideWith, direction, horizontal);

                  if (angular.isUndefined(intersectWithChild)) {
                    var nodeOffset = self.offset(nodeElement);
                    var nodePos = {
                      left: nodeOffset.left,
                      width: nodeOffset.width,
                      right: nodeOffset.left + nodeOffset.width,
                      top: nodeOffset.top,
                      height: nodeOffset.height,
                      bottom: nodeOffset.top + nodeOffset.height
                    };

                    var isOverElementWidth;
                    var isOverElementHeight;
                    if (horizontal) {
                      if (direction < 0) {
                        isOverElementWidth = (collideWith === 'bottom') ? (elmPos.left <= nodePos.right && elmPos.right >= nodePos.left)
                                                                         : (elmPos.right <= nodePos.right && elmPos.right >= nodePos.left);
                      } else if (direction > 0) {
                        isOverElementWidth = (collideWith === 'bottom') ? (elmPos.right >= nodePos.left && elmPos.left <= nodePos.right)
                                                                        : (elmPos.left >= nodePos.left && elmPos.left <= nodePos.right);
                      }
                    }

                    if (direction < 0) {
                      isOverElementHeight = (collideWith === 'bottom') ? (elmPos.top <= nodePos.bottom && elmPos.bottom >= nodePos.top)
                                                                       : (elmPos.bottom <= nodePos.bottom && elmPos.bottom >= nodePos.top);
                    } else if (direction > 0) {
                      isOverElementHeight = (collideWith === 'bottom') ? (elmPos.bottom >= nodePos.top && elmPos.top <= nodePos.bottom)
                                                                       : (elmPos.top >= nodePos.top && elmPos.top <= nodePos.bottom);
                    }

                    if ((horizontal && (isOverElementWidth && isOverElementHeight)) || (!horizontal && isOverElementHeight)) {
                      intersectWith = nodes[nodeIdx];
                    }
                  } else {
                    intersectWith = intersectWithChild;
                  }
                } else {
                  if (angular.isDefined(nodeElement.children()) && nodeElement.children().length > 0) {
                    intersectWith = self.findIntersect(elmPos, nodeElement.children(), collideWith, direction, horizontal);
                  }
                }
              }

              if (angular.isDefined(intersectWith))
              {
                break;
              }
            }

            return intersectWith;
          }
        };
      }
    ]);
})();
