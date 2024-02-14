importPackage(Packages.com.sk89q.worldedit);
importPackage(Packages.com.sk89q.worldedit.blocks);
importPackage(Packages.com.sk89q.worldedit.region);
importPackage(Packages.com.sk89q.worldedit.regions);
importPackage(Packages.com.sk89q.worldedit.math);
importPackage(Packages.com.sk89q.worldedit.world.block);
importPackage(Packages.com.sk89q.worldedit.extent.clipboard);
//// variables ////
var sess = context.remember();
var clipboard = context.getSession().getClipboard().getClipboard();

// clipboard
var clipDimensions = clipboard.getDimensions();
var clipWidth = clipDimensions.x;
var clipLength = clipDimensions.z;
var clipHeight = clipDimensions.y;
var clipboardCorner = clipboard.getMinimumPoint();
var currentScanPos = clipboardCorner;


// argument
var args = ["placeholder"];
for(i=0;i<3;i++){
	args.push(argv[i+3])
}

var air = compareTag("-a");
var placeOnEmpty = compareTag("-b");
var invert = compareTag("-i");
var gap = argv[0]==null?0:argv[1];
var offset = argv[1]==null?0:argv[2];


var p1,d1,p2,d2;
var p1Height,p2Height,lowestHeight;
function GetPoints(){
	if (context.getSession().getRegionSelector(player.getWorld()).getTypeName() != "Convex Polyhedron"){
		player.print("Incorrect Selector Type. Use Convex Selection");
		return;
	}
	var points = context.getSession().getRegionSelector(player.getWorld()).getIncompleteRegion().getVertices().toArray();
	p1 = points[0].toVector3().add(0.5,0,0.5);
	d1 = points[1].toVector3().add(0.5,0,0.5);
	p2 = points[2].toVector3().add(0.5,0,0.5);
	d2 = points[3].toVector3().add(0.5,0,0.5);

	p1Height = p1.y;
	p2Height = p2.y;
	lowestHeight = Math.min(p1Height,p2Height);
	p1 = p1.withY(lowestHeight);
	d1 = d1.withY(lowestHeight);
	p2 = p2.withY(lowestHeight);
	d2 = d2.withY(lowestHeight);
}

var a //y = ax   			p1,d1
var c,d; // y = cx + d		p2,d2
var intersectionPoint;
var p1Inf = false,p2Inf = false;
function FindIntersectionPoint(){
	// find lines of points
	a = d1.subtract(p1);
	if (a.x == 0) {p1Inf = true; a = 1;}
	else {a = a.z/a.x;}

	c = d2.subtract(p2);
	if (c.x == 0) {p2Inf = true; c = 1;}
	else {
		 c = c.z/c.x; 
		 d = p2.subtract(p1);
		d = d.z-d.x*c;
	}

	if (p1Inf == true && p2Inf == false) {intersectionPoint = Vector3.ONE.multiply(0,0,d).add(p1);}
	else if (p1Inf == false && p2Inf == true) {intersectionPoint = Vector3.ONE.multiply(p2.subtract(p1).x,0,a*p2.subtract(p1).x).add(p1);}
	else { intersectionPoint = Vector3.ONE.multiply(d/(a-c),0,(d*a)/(a-c)).add(p1); }

	if (intersectionPoint.distanceSq(d1)<intersectionPoint.distanceSq(p1)) {invert = !invert;}
}

var p3,p4,p5;
var p3Height,p4Height,p5Height;
function MakeEqualDistance(){
	var shortDistance, longDistance;
	var direction = Vector3.ZERO;
	var t; // buffer for a,c
	shortDistance = intersectionPoint.distanceSq(p1);
	if (shortDistance > intersectionPoint.distanceSq(p2)){
		// p2 is closer
		shortDistance = intersectionPoint.distance(p2);
		longDistance = intersectionPoint.distance(p1);
		p3 = p2;
		direction = p1.subtract(intersectionPoint);
		p4 = intersectionPoint.add(direction.multiply(shortDistance/longDistance));
		p5 = p1;
		//
		t = c;
		c = a;
		a = t;
		t = p1Inf;
		p1Inf = p2Inf;
		p2Inf = t;
		p3Height = p2Height;
		p5Height = p1Height;
	}else{
		// p1 is closer
		shortDistance = intersectionPoint.distance(p1);
		longDistance = intersectionPoint.distance(p2);
		p3 = p1;
		direction = p2.subtract(intersectionPoint);
		p4 = intersectionPoint.add(direction.multiply(shortDistance/longDistance));
		p5 = p2;
		p3Height = p1Height;
		p5Height = p2Height;
	}
}

var circleCenter = Vector3.ZERO;
var radius;
var inbetween;
var angleDirection = 1;
var p3Inf = false,p4Inf = false;
function FindCircleCenter(){
	if (a == 0) { p3Inf = true; }
	else if ( p1Inf == true ) { a = 0; }
	else { a = -1/a; }
	if (c == 0) { p4Inf = true; }
	else if (p2Inf == true ) { c = 0; }
	else {
		c = -1/c;
	}
	d = p4.subtract(p3);
	d = d.z-d.x*c;

	if ( p3Inf == true && p4Inf == false) { circleCenter = Vector3.ONE.multiply(0,0,d).add(p3); }
	else if (p3Inf == false && p4Inf == true) { circleCenter = Vector3.ONE.multiply(p4.subtract(p3).x,0,a*p4.subtract(p3).x).add(p3);}
	else { circleCenter = Vector3.ONE.multiply(d/(a-c),0,(d*a)/(a-c)).add(p3); }
	radius = circleCenter.withY(0).distance(p4.withY(0));
	//inbetween = ToAngle(p3.subtract(circleCenter)) - ToAngle(p4.subtract(circleCenter));
	var p3Angle = ToAngle(p3.subtract(circleCenter));
	var p4Angle = ToAngle(p4.subtract(circleCenter));
	inbetween = GetSmallerDeltaAngle(p3Angle,p4Angle);
	if ( p4Angle > p3Angle || (p4Angle + 180) < p3Angle) { angleDirection = -1; }
	if ( invert ) { inbetween = 360 - inbetween; angleDirection *= -1; }
}

var lineLength = 0;
var circleLength = 0;
var normalizedPoint = 0;
function GetLength(){
	lineLength = p5.distance(p4);
	circleLength = (2*Math.PI*radius/360)*Math.abs(inbetween);

	p4Height = Lerp(p5Height,p3Height,lineLength/(lineLength+circleLength));
}

var stepLength = 0.45;
var gapCounter = offset;
//var gapCounter = 0;
function DrawLine(){
	var dirNormalized = p4.subtract(p5).normalize();
	var dirPerpendicular = Vector3.at(dirNormalized.z,0,-dirNormalized.x);
	
	//gapCounter = offset;
	for (var p=0; p<lineLength+1; p+=stepLength)
	{
		if (gapCounter>0) { gapCounter -= stepLength;}
		else if ( gap == 0 || p<lineLength ){
			gapCounter = gap;
			//scan
			var scanOffset;
			var scanBlock;
			currentY = 0;
			var stepXZ;
			var count;
			var currentScan;
			var position;
			
			if(clipWidth > clipLength) { stepXZ = BlockVector3.UNIT_X; count = clipWidth; }
			else { stepXZ = BlockVector3.UNIT_Z; count = clipLength; }
			scanOffset = Vector2.at(-Math.floor(count*0.5)-1,0);
			for(var i=0;i<clipHeight;i++ ){
				currentScan = clipboardCorner.add(0,i,0);
				scanOffset = Vector2.at(-Math.floor(count*0.5)-1,i);
				//scan XZ
				for (var t=0;t<count;t++){
					scanBlock = clipboard.getFullBlock(currentScan);
					scanOffset = scanOffset.add(1,0);
					currentScan = currentScan.add(stepXZ);
					position = p5.add(dirNormalized.multiply(p).add(dirPerpendicular.multiply(scanOffset.x)).withY(scanOffset.z + Lerp(p5Height,p4Height,p/lineLength)-lowestHeight)).toBlockPoint();

					if(placeOnEmpty && sess.getBlock(position) != "minecraft:air"){}
					else if(air && scanBlock.toString() == "minecraft:air"){}
					else {sess.setBlock(position,scanBlock);}
				}
			}
		}
	}
}

var iteration = 70;
var iterateAngle;
var currentAngle;
function DrawCircle(){
	iteration = 4*Math.PI*(radius + clipWidth);
	iterateAngle = (inbetween/iteration)*angleDirection;
	currentAngle = ToAngle(p4.subtract(circleCenter));

	var iterateLength = (1/iteration)*circleLength;
	for (var p = 0;p < iteration;p++){
		currentAngle += iterateAngle;
		if (gapCounter>0) { gapCounter -= iterateLength; }
		else
		{
			gapCounter = gap;
			//scan
			var scanOffset;
			var scanBlock;
			currentY = 0;
			var stepXZ;
			var count;
			var currentScan;
			var position;
			if(clipWidth > clipLength) { stepXZ = BlockVector3.UNIT_X; count = clipWidth; }
			else { stepXZ = BlockVector3.UNIT_Z; count = clipLength; }
			scanOffset = Vector2.at(-Math.floor(count*0.5)-1,0);
			for(var i=0;i<clipHeight;i++ ){
				currentScan = clipboardCorner.add(0,i,0);
				scanOffset = Vector2.at(-Math.floor(count*0.5)-1,i);
				//scan XZ
				for (var t=0;t<count;t++){
					scanBlock = clipboard.getFullBlock(currentScan);
					scanOffset = scanOffset.add(1,0);
					currentScan = currentScan.add(stepXZ);
					position = ToPosition(currentAngle,radius + scanOffset.x).toBlockPoint().add(0,scanOffset.z+Lerp(p4Height,p3Height,p/iteration)-lowestHeight,0);
					
					if(placeOnEmpty && sess.getBlock(position) != "minecraft:air") break;
					if(air && scanBlock.toString() == "minecraft:air") break;
					sess.setBlock(position,scanBlock);
				}
			}
		}
	}
}

function compareTag(string){
	for(i=0;i<args.length;i++){
		if (args[i] == string) {
			return true;
		}
	}
	return false;
}

function GetSmallerDeltaAngle(a,b){
	a = Math.abs(a-b);
	if ( a < 180 ) return a;
	return 360 - a;
}

function ToPosition(angle,_radius){
	var pos = Vector3.ZERO;
	angle = DegToRad(angle);
	pos = Vector3.at(-Math.cos(angle),0,-Math.sin(angle));
	pos = pos.multiply(_radius).add(circleCenter);
	return pos;
}

function ToAngle(dir){
	var angle = Math.atan2(dir.z,dir.x);
	return RadToDeg(angle)+180;
}

function DegToRad(number){
	return number * (Math.PI/180);
}

function RadToDeg(number){
	return number / (Math.PI/180);
}

function Lerp(a,b,t){
	return a + (b-a)*t;
}


// MAIN

player.print("Operating.. Please Wait");
GetPoints();
FindIntersectionPoint();
MakeEqualDistance();
FindCircleCenter();
GetLength();

DrawLine();
DrawCircle();
player.print("Operation Complete. Linear Length : " + Math.round(lineLength) + ", Circular Length : " + Math.round(circleLength) + "");

// END MAIN