importPackage(Packages.com.sk89q.worldedit);
importPackage(Packages.com.sk89q.worldedit.blocks);
importPackage(Packages.com.sk89q.worldedit.region);
importPackage(Packages.com.sk89q.worldedit.regions);
importPackage(Packages.com.sk89q.worldedit.math);
importPackage(Packages.com.sk89q.worldedit.world.block);

//// variables ////
{
var iterations = 1000;

var sess = context.remember();
//get sample
var region = context.getSession().getClipboard().getClipboard().getRegion();
//get control points
//get pos
var vertices
if (context.getSession().getRegionSelector(player.getWorld()).getTypeName() == "cuboid") {
	vertices = [context.getSession().getSelection(player.getWorld()).getPos1(),context.getSession().getSelection(player.getWorld()).getPos2()];
}else if (context.getSession().getRegionSelector(player.getWorld()).getTypeName() == "Convex Polyhedron") {
	vertices = context.getSession().getRegionSelector(player.getWorld()).getIncompleteRegion().getVertices().toArray().concat();
}
//var vertices = context.getSession().getSelection(player.getWorld()).getVertices().toArray().concat();
//control point to start segment from
var currentVert = 0;
//is it linear, quadratic or cubic bezier curve;
var drawType = 0;
//position calculated from bezier
var curvePos;
//previous pos to calculate distance from
var prevPos = vertices[0].toVector3();

//parameters
var arg1 = argv[1];
var gap = 0;
var arg2 = argv[2]==null?0:Math.ceil(argv[2]);
var offset = arg2;
//array that stores extra arguments
var args = ["z"];

//sampling
var sampleBlock;
var currentXZ = 0;
var currentY = 0;

//clipboard
var width = region.getWidth();
var length = region.getLength();
var height = region.getHeight();
var clipboardPos1 = region.getPos1();
var clipboardPos2 = region.getPos2();
var clipboardCorner = clipboardPos2;
var currentPos;
}

//// setup ////
//put extra arguments in args[]
for(i=0;i<4;i++){
	args.push(argv[i+3]);
}
//insert defalt arguments if there is none
arg1 = arg1==null?0:Math.round(argv[1]);
arg2 = arg2==null?0:Math.round(argv[2]);

//// main ////
//check for points
if ( vertices.length < 2 ) {
	//points are missing
	player.print("not enough vertex points");
}else{
	////Process Control Points (insert control points for smoother result)
	if (vertices.length >4) {
		var i=3;
		var n=1;
		while(vertices.length-(i+1)>0 && vertices[i] != null && vertices[i-1] != null){
			//insert vert in the middle of 3,4th points.
			vertices.splice(i,0,vertices[i].toVector3().add(vertices[i-1].toVector3()).divide(2).toBlockPoint());
			i+=3;
		}
	}
	//find corner to start from
	if (clipboardPos1.getX()<=clipboardPos2.getX()) {
		clipboardCorner = BlockVector3.at(clipboardPos1.getX(),clipboardCorner.getY(),clipboardCorner.getZ());
	}
	if (clipboardPos1.getY()<=clipboardPos2.getY()) {
		clipboardCorner = BlockVector3.at(clipboardCorner.getX(),clipboardPos1.getY(),clipboardCorner.getZ());
	}
	if (clipboardPos1.getZ()<=clipboardPos2.getZ()) {
		clipboardCorner = BlockVector3.at(clipboardCorner.getX(),clipboardCorner.getY(),clipboardPos1.getZ());
	}
	currentPos = clipboardCorner;
	//figure out optimal iteration
	iterations = 0;
	for (i=1;i<vertices.length;i++){
		iterations += vertices[i-1].distance(vertices[i]);
	}
	iterations *=1.2;
	////start execution
	draw();
	//end
	player.print("Operation Complete");
}

//// functions ////
//called for every scaned block
function draw(){
	//player.print("draw");
	fetchControlPoints();

	lerp = 0;
	//choose how to draw
	if (drawType==2) {
		drawLinear();
	}else if(drawType==3){
		drawQuadratic();
	}else {
		drawCubic();
	}
	//draw next segment
	if (vertices.length-1-currentVert>0) {
		//player.print("next segment");
		draw();
	}
}
//get control points
var x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4;
function fetchControlPoints(){
	//player.print("fetchControlPoints");
	var vertsToUse = 0;
	//get control points
	x1 = Math.round(vertices[currentVert].getX())+0.5;
	y1 = Math.round(vertices[currentVert].getY());
	z1 = Math.round(vertices[currentVert].getZ())+0.5;

	x2 = Math.round(vertices[currentVert+1].getX())+0.5;
	y2 = Math.round(vertices[currentVert+1].getY());
	z2 = Math.round(vertices[currentVert+1].getZ())+0.5;
	//draw linear
	drawType = 2;
	vertsToUse = 2;
	if (vertices.length-currentVert>2) {
		x3 = Math.round(vertices[currentVert+2].getX())+0.5;
		y3 = Math.round(vertices[currentVert+2].getY());
		z3 = Math.round(vertices[currentVert+2].getZ())+0.5;
		//draw quadratic
		drawType = 3;
		vertsToUse = 3;
		if (vertices.length-currentVert>3) {
			x4 = Math.round(vertices[currentVert+3].getX())+0.5;
			y4 = Math.round(vertices[currentVert+3].getY());
			z4 = Math.round(vertices[currentVert+3].getZ())+0.5;
			//draw cubic
			drawType = 4;
			vertsToUse = 4;
		}
	}
	currentVert += vertsToUse-1;
}
////Bezier curve position
//bezier curve variables
var bezierX,bezierY,bezierZ,deltaX,deltaZ,deltaAngle = 0;
function drawLinear(){
	//player.print("drawLinear");
	while( lerp <= 1 ){
		bezierX = (1-lerp)*x1 + lerp*x2;
		bezierY = (1-lerp)*y1 + lerp*y2;
		bezierZ = (1-lerp)*z1 + lerp*z2;
		deltaAngle = Math.atan((x2 - x1)/(z2 - z1));
		setBlocks();
	}
}
//3 point curve
function drawQuadratic(){
	//player.print("drawQuadratic");
	while( lerp <= 1 ){
		bezierX = (1-lerp)*(1-lerp)*x1 + 2*(1-lerp)*lerp*x2 + lerp*lerp*x3;
		bezierY = (1-lerp)*(1-lerp)*y1 + 2*(1-lerp)*lerp*y2 + lerp*lerp*y3;
		bezierZ = (1-lerp)*(1-lerp)*z1 + 2*(1-lerp)*lerp*z2 + lerp*lerp*z3;
		//get delta angle
		deltaX = (1-lerp)*(x2-x1)+lerp*(x3-x2);
		deltaZ = (1-lerp)*(z2-z1)+lerp*(z3-z2);
		deltaAngle　= Math.atan(deltaX/deltaZ);
		setBlocks();
	}
}
//4 point curve
function drawCubic(){
	//player.print("drawCubic");
	while( lerp <= 1 ){
		bezierX = (1-lerp)*(1-lerp)*(1-lerp)*x1 + 3*(1-lerp)*(1-lerp)*lerp*x2 + 3*(1-lerp)*lerp*lerp*x3 + lerp*lerp*lerp*x4;
		bezierY = (1-lerp)*(1-lerp)*(1-lerp)*y1 + 3*(1-lerp)*(1-lerp)*lerp*y2 + 3*(1-lerp)*lerp*lerp*y3 + lerp*lerp*lerp*y4;
		bezierZ = (1-lerp)*(1-lerp)*(1-lerp)*z1 + 3*(1-lerp)*(1-lerp)*lerp*z2 + 3*(1-lerp)*lerp*lerp*z3 + lerp*lerp*lerp*z4;

		//get delta angle
		deltaX = (1-lerp)*(1-lerp)*(x2-x1)+2*lerp*(1-lerp)*(x3-x2)+lerp*lerp*(x4-x3);
		deltaZ = (1-lerp)*(1-lerp)*(z2-z1)+2*lerp*(1-lerp)*(z3-z2)+lerp*lerp*(z4-z3);
		deltaAngle　= Math.atan(deltaX/deltaZ);
		setBlocks();
	}
}
//set blocks for each sample
function setBlocks(){
	//player.print("setBlocks");
	curvePos = Vector3.at(bezierX,Math.round(bezierY),bezierZ);
	var lengthT = curvePos.subtract(prevPos).length();
	gap -= lengthT;
	offset-= lengthT;
	prevPos = curvePos;
	//only place blocks on interval, check for -a, after arg2
	if ( offset <= 0 && gap <= 0 ){
		scanVertical();
		gap = Math.round(arg1);
	}
	lerp = lerp + 1/iterations;
}
//processing in y axis
function scanVertical(){
	//player.print("scanY");
	currentY = 0;
	while ( currentY < height ){
		currentPos = clipboardCorner.add(0,currentY,0);
		currentXZ = 0;
		scanHorizontal();
		currentY += 1;
	}
}
//Processing in the xz plane
function scanHorizontal(){
	//player.print("scanXZ");
	if (width >= length){
		while( currentXZ <= width-1){
			sampleBlock = sess.getBlock(currentPos);
			currentXZ-=Math.floor(width*0.5);
			place();
			currentXZ+=Math.floor(width*0.5);
			currentPos = currentPos.add( 1 , 0 , 0 );
			currentXZ ++;
		}
	}else{
		while( currentXZ <= length-1){
			sampleBlock = sess.getBlock(currentPos);
			currentXZ-=Math.floor(length*0.5);
			place();
			currentXZ+=Math.floor(length*0.5);
			currentPos = currentPos.add( 0 , 0 , 1 );
			currentXZ ++;
		}
	}
}
//place block according to it's sample position
function place(){
	if( !(compareTag("-a") && sampleBlock.getBlockType() == "minecraft:air") ){
		sess.setBlock(curvePos.add(currentXZ*Math.cos(-deltaAngle) , currentY , currentXZ*Math.sin(-deltaAngle)).toBlockPoint(), sampleBlock.toBaseBlock());
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