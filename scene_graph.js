'use strict';

/**
 * A function that creates and returns the scene graph classes and constants.
 */
function createSceneGraphModule() {

    // Part names. Use these to name your different nodes
    var CAR_PART = 'CAR_PART';
    var FRONT_AXLE_PART = 'FRONT_AXLE_PART';
    var BACK_AXLE_PART = 'BACK_AXLE_PART';
    var FRONT_LEFT_TIRE_PART = 'FRONT_LEFT_TIRE_PART';
    var FRONT_RIGHT_TIRE_PART = 'FRONT_RIGHT_TIRE_PART';
    var BACK_LEFT_TIRE_PART = 'BACK_LEFT_TIRE_PART';
    var BACK_RIGHT_TIRE_PART = 'BACK_RIGHT_TIRE_PART';
    var DEF_WIDTH=80;
    var DEF_HEIGHT=150;
    var DEF_COLOUR='red';
    var TIRE_WIDTH=20;
    var TIRE_HEIGHT=30;
    var AXLE_WIDTH=120;
    var AXLE_HEIGHT=7;
    var DEF_SIZE=10;

    var GraphNode = function() {
        this.nodeName="";
        this.action=""; //determines the type of action, ie rotation, translation, scale
        this.colour="";
        this.posX=0;
        this.posY=0;
        this.scaleX=1;
        this.scaleY=1;
        this.parent;
        this.startPositionTransform;
        this.objectTransform;
        this.scaleTransform;//this transform will only be applied to car
        this.rotateTransform;//this transform will only be applied to tires
        this.children=[];
        this.xborder= 1;//defines the border size on the sides of car
        this.yborder= 1;//defines the border size control point on the top/btm of car
        this.xcenter=0;
        this.ycenter=0;
        this.rotation=0;
    };

    _.extend(GraphNode.prototype, {

        /**
         * Subclasses should call this function to initialize the object.
         *
         * @param startPositionTransform The transform that should be applied prior
         * to performing any rendering, so that the component can render in its own,
         * local, object-centric coordinate system.
         * @param nodeName The name of the node. Useful for debugging, but also used to uniquely identify each node
         */
        initGraphNode: function(startPositionTransform, nodeName) {

            this.nodeName = nodeName;

            // The transform that will position this object, relative
            // to its parent
            this.startPositionTransform = startPositionTransform;

            // Any additional transforms of this object after the previous transform
            // has been applied
            this.objectTransform = new AffineTransform();
            this.scaleTransform=new AffineTransform();
            this.rotateTransform=new AffineTransform();
            // Any child nodes of this node
            this.children = {};
            this.rotation=0;
            this.posX=0;
            this.posY=0;
            this.scaleX=1;
            this.scaleY=1;
            this.action="translate";
            this.colour=DEF_COLOUR;
            this.xborder=DEF_WIDTH/9;
            this.yborder=DEF_HEIGHT/9;

        },

        addChild: function(graphNode) {
            this.children[graphNode.nodeName] = graphNode;
            graphNode.startPositionTransform.copyFrom(this.startPositionTransform);
            graphNode.parent=this;
        },

        /**
         * Swaps a graph node with a new graph node.
         * @param nodeName The name of the graph node
         * @param newNode The new graph node
         */
        replaceGraphNode: function(nodeName, newNode) {
            if (nodeName in this.children) {
                this.children[nodeName] = newNode;
            } else {
                _.each(
                    _.values(this.children),
                    function(child) {
                        child.replaceGraphNode(nodeName, newNode);
                    }
                );
            }
        },

        /**
         * Render this node using the graphics context provided.
         * Prior to doing any painting, the start_position_transform must be
         * applied, so the component can render itself in its local, object-centric
         * coordinate system. See the assignment specs for more details.
         *
         * This method should also call each child's render method.
         * @param context
         */
        render: function(context) {
            _.each(
                _.values(this.children),
                function(child) {
                    child.render(context);
                }
            );

        },

        /**
         * Determines whether a point lies within this object. Be sure the point is
         * transformed correctly prior to performing the hit test.
         */
        pointInObject: function(point) {
            // TODO: There are ways to handle this query here, but you may find it easier to handle in subclasses
        },
        Localize: function(point){
            var inverse = this.objectTransform.createInverse();
            var mouse_pos = [];
            mouse_pos = {0: point.x, 1: point.y};
            mouse_pos[1] = point.y;

            inverse.transform(mouse_pos, 0, mouse_pos, 0, 1);

            return mouse_pos;
        },
        /**Resets all transforms and re-renders.
         */
        Reset: function(){
            this.startPositionTransform=new AffineTransform();
            this.objectTransform.copyFrom(this.startPositionTransform);
            this.scaleTransform=new AffineTransform();
            this.rotateTransform=new AffineTransform();
            this.rotation=0;
            this.posX=0;
            this.posY=0;
            this.scaleX=1;
            this.scaleY=1;
            _.each(
                _.values(this.children),
                function(child) {
                    child.Reset();

                }
            );
        }

    });

    var CarNode = function() {

        this.initGraphNode(new AffineTransform(), CAR_PART)
    };

    _.extend(CarNode.prototype, GraphNode.prototype, {
        // Overrides parent method
        render: function(context) {
            this.objectTransform.copyFrom(this.startPositionTransform);
            //this.objectTransform.translate(-DEF_WIDTH/2,-DEF_HEIGHT/2);
            this.scaleX=this.scaleTransform.getScaleX();
            this.scaleY=this.scaleTransform.getScaleY();
            this.x=this.objectTransform.getTranslateX();
            this.y=this.objectTransform.getTranslateY();
            context.save();
            //applyTransform(this.objectTransform, context);
            var parent=this;
            var parent_transform=this.objectTransform;
            this.xcenter=0;
            this.ycenter=0;
            this.posX=-DEF_WIDTH/2;
            this.posY=-DEF_HEIGHT/2;
            _.each(
                _.values(this.children),
                function(child) {
                    child.startPositionTransform.copyFrom(parent_transform);
                    child.render(context);

                }
            );
                this.objectTransform.concatenate(this.scaleTransform);
                applyTransform(this.objectTransform, context);
            context.fillStyle = this.colour;
            context.fillRect(this.posX, this.posY, DEF_WIDTH, DEF_HEIGHT);//renders car
            context.fillStyle = 'white';
            context.lineWidth = 3;
            context.strokeStyle = 'black';
            context.fillRect(this.posX+DEF_WIDTH/4, this.posY+DEF_HEIGHT/4, DEF_WIDTH/2, DEF_HEIGHT/5); //renders window
            context.strokeRect(this.posX+DEF_WIDTH/4, this.posY+DEF_HEIGHT/4, DEF_WIDTH/2, DEF_HEIGHT/5); //renders window
            context.beginPath();
            context.arc(this.posX+DEF_WIDTH/4, this.posY+10, DEF_SIZE, 0, 2 * Math.PI, false); //renders headlights
            context.fillStyle = 'yellow';
            context.fill();
            context.arc(this.posX+DEF_WIDTH/1.3, this.posY+10, DEF_SIZE, 0, 2 * Math.PI, false);
            context.fill();
            context.closePath();
            context.restore();
        },

        // Overrides parent method
        pointInObject: function(point) {
            var inverse = this.objectTransform.createInverse();
            var mouse_pos = [];
            mouse_pos = {0: point.x, 1: point.y};
            mouse_pos[1] = point.y;
            var left_lim=DEF_WIDTH/2;
            var top_lim=DEF_HEIGHT/2;
            inverse.transform(mouse_pos, 0, mouse_pos, 0, 1);

            var rel_x = mouse_pos[0];
            var rel_y = mouse_pos[1];
            //console.log("x: " + point.x+ " " + rel_x);
           // console.log("y: " + point.y+ " " + rel_y);
            if (rel_x >= -left_lim && rel_x <= left_lim && rel_y >= -top_lim && rel_y <= top_lim) {
                //console.log("hit");
                if (rel_x < this.xborder-left_lim || rel_x > left_lim - this.xborder) {
                    //console.log("hit");
                    this.action = "scaleX";
                } else if (rel_y < this.yborder-top_lim || rel_y > top_lim - this.yborder){
                    this.action = "scaleY";
                }else {
                    this.action="translate";
                }
                return true;
            } else {
                this.action="rotate";
                return false;
            }
        }
    });

    /**
     * @param axlePartName Which axle this node represents
     * @constructor
     */
    var AxleNode = function(axlePartName) {
        this.initGraphNode(new AffineTransform(), axlePartName);
        // TODO
    };

    _.extend(AxleNode.prototype, GraphNode.prototype, {
        // Overrides parent method
        render: function(context) {

            this.scaleX=this.scaleTransform.getScaleX();
            this.scaleY=this.scaleTransform.getScaleY();
            this.xcenter=AXLE_WIDTH/2
            this.ycenter=AXLE_HEIGHT/2;
            this.objectTransform.copyFrom(this.startPositionTransform);

            var parent_transform=this.objectTransform;

            this.posX=AXLE_WIDTH/-2*this.scaleX;
            this.posY=AXLE_HEIGHT/-2*this.scaleY;
            context.save();
            //parent_transform.translate(this.posX,this.posY);
            var parent=this;

            //console.log(this.startPositionTransform.toString());


            var y=0;
            //console.log("parent y "+this.parent.y);
            this.objectTransform.concatenate(this.scaleTransform);
            applyTransform(this.objectTransform, context);
            if(this.nodeName==FRONT_AXLE_PART){
                y=this.posY-this.parent.scaleY*(DEF_HEIGHT-90);
            }else{
                y=this.posY+this.parent.scaleY*(DEF_HEIGHT-80);
            }


            context.fillStyle = '#575757';
            context.fillRect(this.posX, y, this.scaleX*AXLE_WIDTH, this.scaleY*AXLE_HEIGHT);
            _.each(
                _.values(this.children),
                function(child) {
                    //console.log(child.nodeName);
                    child.startPositionTransform.copyFrom(parent_transform);
                    child.render(context);

                }
            );

            context.restore();

        },

        // Overrides parent method
        pointInObject: function(point) {
            // User can't select axles
            return false;
        }
    });

    /**
     * @param tirePartName Which tire this node represents
     * @constructor
     */
    var TireNode = function(tirePartName) {
        this.initGraphNode(new AffineTransform(), tirePartName);
        // TODO
    };

    _.extend(TireNode.prototype, GraphNode.prototype, {
        // Overrides parent method
        render: function(context) {
            var x = -1 * (this.scaleX / this.parent.scaleX * TIRE_WIDTH / 2);
            this.posX = this.parent.posX;
            this.posY = 0;
            var y = this.posY;
            context.fillStyle = 'black';
            this.objectTransform.copyFrom(this.startPositionTransform);
            context.save();
            if (this.nodeName == FRONT_RIGHT_TIRE_PART) {
                //console.log("pxscale "+this.parent.scaleX);
                x += this.posX + this.parent.scaleX * AXLE_WIDTH + (AXLE_WIDTH * this.parent.scaleX) / 2;
                y = this.posY - this.parent.parent.scaleY * DEF_HEIGHT / 2.2;
            }
            if (this.nodeName == FRONT_LEFT_TIRE_PART) {
                //x=this.posX+this.parent.scaleX*AXLE_WIDTH+AXLE_WIDTH/2;
                y = this.posY - this.parent.parent.scaleY * DEF_HEIGHT / 2.2;
            }
            if (this.nodeName == BACK_RIGHT_TIRE_PART) {
                x += this.posX + this.parent.scaleX * AXLE_WIDTH + (AXLE_WIDTH * this.parent.scaleX) / 2;
                y = this.posY + this.parent.parent.scaleY * DEF_HEIGHT / 3;
            }

            if (this.nodeName == BACK_LEFT_TIRE_PART) {
                y = this.posY + this.parent.parent.scaleY * DEF_HEIGHT / 3;
            }

            //console.log(this.rotation);
            this.objectTransform.translate(this.posX+x,y);
            this.objectTransform.concatenate(this.rotateTransform);
            applyTransform(this.objectTransform, context);
            //this.rotateTransform=new AffineTransform();
            context.fillRect(0, 0, this.scaleX/this.parent.scaleX*TIRE_WIDTH, this.scaleY*TIRE_HEIGHT);
            context.restore();


        },

        // Overrides parent method
        pointInObject: function(point) {
            var inverse = this.objectTransform.createInverse();
            var mouse_pos = [];
            mouse_pos = {0: point.x, 1: point.y};
            mouse_pos[1] = point.y;
            inverse.transform(mouse_pos, 0, mouse_pos, 0, 1);

            var rel_x = mouse_pos[0];
            var rel_y = mouse_pos[1];
            //console.log("x: " + rel_x);
            //console.log("y: " + rel_y);
            if (rel_x > 0 && rel_x <= TIRE_WIDTH && rel_y > 0 && rel_y <= TIRE_HEIGHT) {

                if (rel_x < this.xborder || rel_x > TIRE_WIDTH - this.xborder) {
                    this.action = "scaleX";
                } else if (rel_y < this.yborder || rel_y > TIRE_HEIGHT - this.yborder){
                    this.action = "scaleY";
                }else {
                    this.action="translate";
                }
                return true;
            } else {
                return false;
            }
        }
    });
    function applyTransform(matrix,context){
        context.setTransform(matrix.m00_,
                            matrix.m10_,
                            matrix.m01_,
                            matrix.m11_,
                            matrix.m02_,
                            matrix.m12_);
    }
    // Return an object containing all of our classes and constants
    return {
        GraphNode: GraphNode,
        CarNode: CarNode,
        AxleNode: AxleNode,
        TireNode: TireNode,
        DEF_WIDTH:DEF_WIDTH,
        DEF_HEIGHT:DEF_HEIGHT,
        CAR_PART: CAR_PART,
        AXLE_WIDTH:AXLE_WIDTH,
        TIRE_WIDTH:TIRE_WIDTH,
        TIRE_HEIGHT:TIRE_HEIGHT,
        FRONT_AXLE_PART: FRONT_AXLE_PART,
        BACK_AXLE_PART: BACK_AXLE_PART,
        FRONT_LEFT_TIRE_PART: FRONT_LEFT_TIRE_PART,
        FRONT_RIGHT_TIRE_PART: FRONT_RIGHT_TIRE_PART,
        BACK_LEFT_TIRE_PART: BACK_LEFT_TIRE_PART,
        BACK_RIGHT_TIRE_PART: BACK_RIGHT_TIRE_PART
    };
}