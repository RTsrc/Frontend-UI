'use strict';

// This should be your main point of entry for your app

var MAX_CWIDTH=150;
var MIN_CWIDTH=25;
var MIN_CLENGTH=50;
var MAX_CLENGTH=200;
var MAX_ALENGTH=75;
window.addEventListener('load', function() {
    var sceneGraphModule = new createSceneGraphModule();
    var appContainer = document.getElementById('app-container');
    var colour_pick = document.getElementById('colorpicker');
    var canvas = document.getElementById('graph_canvas');
    var WIDTH=canvas.width;
    var HEIGHT=canvas.height;
    var xOffset=canvas.offsetLeft;
    var yOffset=canvas.offsetTop;
    var mainContext = canvas.getContext('2d');
    var myCar= new sceneGraphModule.CarNode();
    var axle1= new sceneGraphModule.AxleNode(sceneGraphModule.FRONT_AXLE_PART);
    var axle2= new sceneGraphModule.AxleNode(sceneGraphModule.BACK_AXLE_PART);
    var tire1= new sceneGraphModule.TireNode(sceneGraphModule.FRONT_LEFT_TIRE_PART);
    var tire2= new sceneGraphModule.TireNode(sceneGraphModule.FRONT_RIGHT_TIRE_PART);
    var tire3= new sceneGraphModule.TireNode(sceneGraphModule.BACK_LEFT_TIRE_PART);
    var tire4= new sceneGraphModule.TireNode(sceneGraphModule.BACK_RIGHT_TIRE_PART);
    var currX=0;
    var currY=0;
    var idMatrix = new AffineTransform();
    var myMatrix= new AffineTransform();
    var canRotate=true;
    var canScale=true;
    var CAR_PART=sceneGraphModule.CAR_PART;
    var AXLE_PART=sceneGraphModule.FRONT_AXLE_PART;
    var AXLE_PART2=sceneGraphModule.BACK_AXLE_PART;
    var CAR_WIDTH=sceneGraphModule.DEF_WIDTH;
    var CAR_HEIGHT=sceneGraphModule.DEF_HEIGHT;
    var AXLE_WIDTH=sceneGraphModule.AXLE_WIDTH;
    var TIRE_WIDTH=sceneGraphModule.TIRE_WIDTH;
    var TIRE_HEIGHT=sceneGraphModule.TIRE_HEIGHT;
    myMatrix.copyFrom(idMatrix);
    myMatrix.translate(250,150);
    colour_pick.addEventListener("change", ChangeColour);
    document.addEventListener("mousemove", showCoords);
    myCar.startPositionTransform.copyFrom(myMatrix);
    //mainContext.translate(500,0);

    axle1.addChild(tire1);
    axle1.addChild(tire2);
    axle2.addChild(tire3);
    axle2.addChild(tire4);
    myCar.addChild(axle1);
    myCar.addChild(axle2);
    ////var timed=setInterval(draw(mainContext,myCar), 1000);
    var reset=document.getElementById("reset-button");
    reset.addEventListener('click',Reset);

    draw(mainContext,myCar);

    canvas.addEventListener('mousedown',function() {
        var point = {x: event.pageX - canvas.offsetLeft, y: event.pageY - canvas.offsetTop};
        var hitTest=myCar.pointInObject(point);
        //var local=myCar.Localize(point);
        var clk_tr_ul=tire1.pointInObject(point);
        var clk_tr_ur=tire2.pointInObject(point);
        var clk_tr_ll=tire3.pointInObject(point);
        var clk_tr_lr=tire4.pointInObject(point);
        if(clk_tr_lr||clk_tr_ll) canvas.addEventListener('mousemove',resizeAxle);
        if(clk_tr_ur||clk_tr_ul) canvas.addEventListener('mousemove',distinguish);
        currX=point.x;
        currY=point.y;
        //console.log(point);
       if(hitTest) {
           if(myCar.action=="translate") canvas.addEventListener('mousemove',drag);
           if(myCar.action=="scaleX"||myCar.action=="scaleY") canvas.addEventListener('mousemove',dragScale);
       }else if(!(clk_tr_ul||clk_tr_ur||clk_tr_ll||clk_tr_lr)){
           canvas.addEventListener('mousemove',dragRotate);
       }

    });
    canvas.addEventListener('mouseup',function(){
        canvas.removeEventListener('mousemove',drag);
        canvas.removeEventListener('mousemove',dragRotate);
        canvas.removeEventListener('mousemove',dragScale);
        canvas.removeEventListener('mousemove',resizeAxle);
        canvas.removeEventListener('mousemove',distinguish);
        canScale=true;
        canRotate=true;
    });

    function clear(context){
       context.clearRect(0,0,WIDTH,HEIGHT);
        //console.log('reset');

    }
    function draw(context,graphNode){
        clear(context);
        context.save();
        context.setTransform(1,0,0,1,0,0);
        graphNode.render(context);
        context.restore();
    }
    function Reset(){
        myCar.Reset();
        myCar.startPositionTransform.copyFrom(myMatrix);
        draw(mainContext,myCar);
    }
    function ChangeColour(){
        myCar.colour= colour_pick.value;
        draw(mainContext,myCar);
    }
    function Translate(graphNode,context){
        var canvas=document.getElementById('graph_canvas');
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        var newTransform=graphNode.startPositionTransform;
        var new_x=x-newTransform.getTranslateX();
        var new_y=y-newTransform.getTranslateY();
        newTransform.preTranslate(new_x,new_y);
        draw(context,graphNode);


    }
    function Rotate(graphNode,context){
        var point = {x: event.pageX - xOffset, y: event.pageY - yOffset};
        var local=myCar.Localize(point);
        var x = event.pageX - xOffset;
        var y = event.pageY - yOffset;
        var loc_x = local[0];
        var loc_y = local[1];
        var buffer=-20; //amt to tone down rotation
        var newTransform=graphNode.startPositionTransform;
        if(x<=currX&&y>=currY) buffer=20;
        //if(x<=currX&&y>=currY) buffer=10;
        var theta=Math.atan2(x,y)/buffer;
        newTransform.rotate(theta,0,0);
        //graphNode.startPositionTransform.copyFrom(newTransform);
        draw(context,graphNode);

    }
    function RotateTires(graphNode,context){
        var point = {x: event.pageX - xOffset, y: event.pageY - yOffset};
        var local=myCar.Localize(point);
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        var loc_x = local[0];
        var loc_y = local[1];
        var buffer=-20; //amt to tone down rotation
        if(x<=currX&&y>=currY) buffer=20;
        var rotate_lim=Math.PI/4;
        var theta=Math.atan2(x,y)/buffer;
            _.each(
                _.values(graphNode.parent.children),
                function(child) {
                    var x_anchor=child.objectTransform.getTranslateX()+TIRE_WIDTH*(child.parent.scaleX)/2;
                    var y_anchor=child.objectTransform.getTranslateY()+TIRE_HEIGHT/2;
                    child.action="rotate";
                    if(Math.abs(child.rotation)<rotate_lim) {
                        child.rotation+=theta;
                        child.rotateTransform.rotate(theta, TIRE_WIDTH/2, TIRE_HEIGHT/2);
                    }else{
                        if(child.rotation<-rotate_lim&&theta>0||child.rotation>rotate_lim&&theta<0) {
                            child.rotation += theta;
                            child.rotateTransform.rotate(theta, TIRE_WIDTH / 2, TIRE_HEIGHT / 2);
                        }
                    }

                }
            );
        draw(context,graphNode.parent.parent);

    }
    function ScaleAxle(graphNode,context){
        var point = {x: event.pageX - xOffset, y: event.pageY - yOffset};
        var local=graphNode.Localize(point);
        var loc_x = local[0];
        var loc_y = local[1];
        //console.log("x " + loc_x+" y "+loc_y);
        var newTransform=graphNode.scaleTransform;
        var currScale=newTransform.getScaleX();
        var x = event.pageX - xOffset;
        var y = event.pageY - yOffset;
        var scale_x=1;
        var unit=0.01;
        var new_x=scale_x+unit;
        var tire_distance=Math.abs((CAR_WIDTH*graphNode.parent.scaleX)/2-(AXLE_WIDTH*graphNode.scaleX)/2);
        if(currX<x||currY<y) {
            if(loc_x<=graphNode.parent.xcenter&&currScale>=1) {
                new_x = scale_x - unit;
            }

            if(loc_x>=graphNode.parent.xcenter) {
                new_x = scale_x + unit;
            }


        }
        if(currX>x&&currScale>=1||currY>y&&currScale>=1) {
            if(loc_x<=graphNode.parent.xcenter) {

                new_x = scale_x + unit;
            }

            if(loc_x>=graphNode.parent.xcenter&&currScale>=1) {

                new_x = scale_x - unit;
            }

        }
        if(tire_distance<75) {
            newTransform.scale(new_x, 1);
        }else{
            newTransform.scale(new_x *.99, 1);
        }
        if(currScale<1) {
            newTransform.scale(1, 1);
        }
        //console.log("new: "+ newTransform.toString());
        draw(context,graphNode.parent);
    }

    function Scale(graphNode,context){
        var point = {x: event.pageX - xOffset, y: event.pageY - yOffset};
        var local=graphNode.Localize(point);
        var loc_x = local[0];
        var loc_y = local[1];
        var x = event.pageX - xOffset;
        var y = event.pageY - yOffset;
        var scale_x=1;
        var scale_y=1;
        var unit=0.01;
        var new_x=scale_x;
        var new_y=scale_y;
        var partName=graphNode.nodeName;
        //console.log("loc x"+local[0]);
        //console.log("loc y"+local[1]);
        /*console.log("x: "+ x);
        console.log("oldx: "+ currX);
        console.log("y: "+ y);
        console.log("oldy: "+ currY);*/
        var newTransform=graphNode.scaleTransform;
        //console.log("new: "+ newTransform.toString());

        if(currX<x&&graphNode.action=="scaleX") {
            if(loc_x<=graphNode.xcenter) new_x=scale_x-unit;
            if(loc_x>graphNode.xcenter) new_x=scale_x+unit;
        }

        if(currY<y&&graphNode.action=="scaleY") {
            if(loc_y<=graphNode.ycenter) new_y=scale_y-unit;
            if(loc_y>graphNode.ycenter) new_y=scale_y+unit;
        }

        if(currX>x&&graphNode.action=="scaleX") {
            if(loc_x<=graphNode.xcenter) new_x=scale_x+unit;
            if(loc_x>graphNode.xcenter) new_x=scale_x-unit;
        }

        if(currY>y&&graphNode.action=="scaleY") {
            if(loc_y<=graphNode.ycenter) new_y=scale_y+unit;
            if(loc_y>graphNode.ycenter) new_y=scale_y-unit;
        }
        if(partName==CAR_PART){
            var currWidth=newTransform.getScaleX()*CAR_WIDTH;
            var currHeight=newTransform.getScaleY()*CAR_HEIGHT;
            if(currHeight<=MAX_CLENGTH&&currHeight>=MIN_CLENGTH&&currWidth<=MAX_CWIDTH&&currHeight>=MIN_CWIDTH){
                newTransform.scale(new_x,new_y);
            }else{
                if(currHeight>MAX_CLENGTH) newTransform.scale(1,MAX_CLENGTH/currHeight);
                if(currHeight<MIN_CLENGTH) newTransform.scale(1,MIN_CLENGTH/currHeight);
                if(currWidth>MAX_CWIDTH) newTransform.scale(MAX_CWIDTH/currWidth,1);
                if(currWidth<MIN_CWIDTH) newTransform.scale(MIN_CWIDTH/currWidth,1);
            }
        }
        if(partName.indexOf("AXLE")>-1){
            newTransform.scale(new_x,new_y);
        }

        //newTransform.scale(new_x,new_y);
        draw(context,graphNode);
    }
    function drag(){
        Translate(myCar,mainContext);
        canRotate=false;
    }

    function dragRotate(){
        Rotate(myCar,mainContext);
    }
    function dragScale(){
        Scale(myCar,mainContext);
    }
    function resizeAxle(){
        var point = {x: event.pageX - canvas.offsetLeft, y: event.pageY - canvas.offsetTop};
        if(canScale) {
            ScaleAxle(axle1, mainContext);
            ScaleAxle(axle2, mainContext);
        }
    }

    function distinguish(){
        var point = {x: event.pageX - canvas.offsetLeft, y: event.pageY - canvas.offsetTop};
        var y_offset=15;
        var x_offset=10;
        var y_diff=Math.abs(currY-point.y);
        var x_diff=Math.abs(currX-point.x);
       //console.log("mouse moved "+y_diff);
        if(y_diff>y_offset&&x_diff>=x_offset){
            //console.log("diagonal drag");
            canScale=false;
            RotateTires(tire1,mainContext);

        }
        if(y_diff<=y_offset){
            resizeAxle();
        }
    }
});

function showCoords(event) {
    var x = event.clientX;
    var y = event.clientY;
    var coor = "X: " + x + ", Y: " + y;
    document.getElementById("mouse_info").innerHTML = coor;
}