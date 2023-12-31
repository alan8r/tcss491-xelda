/**
 * @author Gabe Bryan (modified from Dr. Marriotts collision methods)
 */

const COLLIDER_TYPES = ["line", "box", "circle"];

const COLLISION_GAP = 0.01;//Gap that is created when a physics collision is made

/**
 * Called on all entities that have a phys2d component
 * @param {*} entities 
 */
const updatePhys = (entities) => {
    let entitiesCount = entities.length;
    for(let i =0; i < entitiesCount; i++){
        let entity = entities[i];
        if(!entity.removeFromWorld && entity.phys2d && !entity.phys2d.static){
            let prevX = entity.x;
            let prevY = entity.y;

            entity.x += entity.phys2d.velocity.x;
            entity.y += entity.phys2d.velocity.y;
            if(entity.collider && entity.phys2d){
                entity.updateCollider();
                if(entity.phys2d.isSolid !== false) correctMovement(prevX, prevY, entity);
            }
            
        }
    }
}

/**
     * Called once per tick after adjusting player position
     * @param {*} prevX x value before velocity was applied
     * @param {*} prevY y value before velocity was applied
     */
correctMovement = (prevX, prevY, me) => {
    me.colliding = false;//.sort((e1, e2) => -(distance(e1, this) - distance(e2, this)))
    let scene = gameEngine.scene;
    scene.env_entities.concat(scene.interact_entities).forEach(entity => {
        if( entity.collider != undefined && entity.collider.type === "box" && entity != me
            && entity.phys2d && entity.phys2d.static && entity.phys2d.isSolid !== false
            && (entity.tag == "environment" || entity.tag == "env_interact" || entity.tag == "env_interact_breakable")){
            
            //Check to see if player is colliding with entity
            let colliding = checkCollision(me, entity);
            //check to see if the collision entity is solid and the type of entity we are looking for
            if(colliding){
                me.colliding = colliding || me.colliding;//store for later purposes
                if(entity instanceof Knight && me instanceof Knight) console.log("two knights");
                dynmStaticColHandler(me, entity, prevX, prevY);//Handle collision
                me.updateCollider();
            }
        }
    });
    if(me.tag == "enemy"){
        let centX = me.collider.corner.x + me.collider.width/2;
        let centY = me.collider.corner.y + me.collider.height/2;
        let canW = gameEngine.ctx.canvas.clientWidth;
        let canH = gameEngine.ctx.canvas.clientHeight;

        let xDiff = canW - centX;
        if(xDiff < 0) me.x += xDiff;
        else if(centX < 0) me.x -= centX;

        let yDiff = canH - centY;
        if(yDiff < 0) me.y += yDiff;
        else if(centY < 0) me.y -= centY;
    }
}

const checkCollision = (entity1, entity2, callback = undefined) => {
    if(entity1.collider == null || entity2.collider == null) {
        console.error("You are passing an entity that has no collider!");
        return null;
    }
    let type1 = COLLIDER_TYPES.indexOf(entity1.collider.type);
    let type2 = COLLIDER_TYPES.indexOf(entity2.collider.type);
    let hasCallback = callback != undefined;

    if(type1 == 0){
        if(type2 == 0){
            return hasCallback ? lineLineCol(entity1.collider, entity2.collider, callback) : lineLineCol(entity1.collider, entity2.collider);
        } else if(type2 == 2){
            return hasCallback ? lineCircleCol(entity1.collider, entity2.collider, callback) : lineCircleCol(entity1.collider, entity2.collider);
        }else {
            console.error("Sorry, either entity 2 is using a non existant collider type or the collision type is unsupported.");
        }
    } else if(type1 == 1) {
        if(type2 == 1){
            return hasCallback ? boxBoxCol(entity1.collider, entity2.collider, callback) : boxBoxCol(entity1.collider, entity2.collider);
        }else {
            console.error("Sorry, either entity 2 is using a non existant collider type or the collision type is unsupported.");
        }
    } else if(type1 == 2){
        if(type2 == 0){
            return hasCallback ? lineCircleCol(entity2.collider, entity1.collider, callback) : lineCircleCol(entity2.collider, entity1.collider);
        } else if(type2 == 2){
            return hasCallback ? lineLineCol(entity1.collider, entity2.collider, callback) : lineLineCol(entity1.collider, entity2.collider);
        }else {
            console.error("Sorry, either entity 2 is using a non existant collider type or the collision type is unsupported.");
        }
    }else{
        console.error("Sorry, the entity 1 collider type is non existant");
        return null;
    }
}

/**
 * 
 * @param {*} line1 composed of a slope and yInt (y intercept)
 * @param {*} line2 composed of a slope and yInt
 * @param {*} callback functionthat determines what to return (the coords of the collision or false if no collision by default)
 * @returns the callback function output
 */
const lineLineCol = (line1, line2, callback = (collision) => {return collision;}) => {
    let slope1 = line1.slope;
    let slope2 = line2.slope;
    let yInt1 = line1.yInt;
    let yInt2 = line2.yInt;

    let col = false;
    if(slope1 === slope2 && yInt1 != yInt2) return callback(col);
    
    let xVal = (yInt1 - yInt2)/(slope2 - slope1);
    col = {x: xVal, y: xVal * slope1 + yInt1};
    return callback(col);

}

/**
 * 
 * @param {*} circle1 composed of a center.x, center.y, and radius
 * @param {*} circle2 composed of a center.x, center.y, and radius
 * @param {*} callback function for determining what to return (true or false by default)
 * @returns the callback function output
 */
const circleCircleCol = (circle1, circle2, callback = (dist) => dist <= circle1.radius || dist <= circle2.radius) => {
    let d = distance(circle1.center, circle2.center);
    return callback(d);
}

/**
 * 
 * @param {*} box1 consists of a top left corner (box.corner) point and a width and height (cant be rotated)
 * @param {*} box2 onsists of a top left corner (box.corner) point and a width and height (cant be rotated)
 * @param {*} callback 
 */
const boxBoxCol = (box1, box2, callback = (whereIsB1) => {return !(whereIsB1.up || whereIsB1.down || whereIsB1.right || whereIsB1.left)}, debug = false) => {
    try{
        let xDist = box1.corner.x - box2.corner.x;
        let yDist = box1.corner.y - box2.corner.y;

        let results = { up: yDist <= -box1.height,
                        down: yDist >= box2.height, 
                        right: xDist >= box2.width, 
                        left: xDist <= -box1.width};
        if(debug) console.log(results);

        return callback(results);
    }catch(TypeError){
        console.error(TypeError);
        console.error(box1);
    }
}

/**
 * 
 * @param {*} line composed of a slope and a y intercept
 * @param {*} circle composed of a center.x, center.y, and radius
 * @param {*} callback function for returning.
 * The parameter is an object containing the x, y coords where the collision(s) takes place.
 * i.e. {{x, y}} or {{x1, y1}, {x2, y2}}
 * @returns whatever the callback says so :P
 */
const lineCircleCol = (line, circle, callback = (collisions) => {return collisions;}) => {
    let slope = line.slope;
    let yInt = line.yInt;

    let a = 1 + slope ** 2;
    let b = 2 * (slope * (yInt - circle.center.y) - circle.center.x);
    let c = circle.center.x ** 2 + (yInt - circle.center.y) ** 2 - circle.radius ** 2;

    let d = b * b - 4 * a * c;
    let cols = false;
    if (d === 0) {
        xVal = -b / (2 * a);
        cols = {x: xVal, y: slope * xVal + yInt};
    } else if (d > 0) {
        let xVals = {x1: (-b + Math.sqrt(d)) / (2 * a), x2: (-b - Math.sqrt(d)) / (2 * a)};
        cols = {col1: {x: xVals.x1, y: slope * xVals.x1 + yInt}, col2: {x: xVals.x1, y: slope * xVals.x1 + yInt}};
    }
    return callback(cols);
}

const dynmStaticColHandler = (dynmEntity, staticEntity, prevX, prevY) =>{
    let xOff = (dynmEntity.x - dynmEntity.collider.corner.x);
    let yOff = (dynmEntity.y - dynmEntity.collider.corner.y);
    //console.log("yOff: " + yOff);

    //Old position
    let oldBB = {corner: {x: prevX - xOff, y: prevY - yOff}, width: dynmEntity.collider.width, height: dynmEntity.collider.height};
    
    let sAffected = boxBoxCol(oldBB, staticEntity.collider, (results) => {return results});
    /*if(dynmEntity.sidesAffected != undefined){
        dynmEntity.sidesAffected = {up: sAffected.up  || dynmEntity.sidesAffected.up, 
            down: sAffected.down || dynmEntity.sidesAffected.down, 
            left: sAffected.left || dynmEntity.sidesAffected.left, 
            right: sAffected.right || dynmEntity.sidesAffected.right};
    }else{
        dynmEntity.sidesAffected = sAffected;
    }*/
    dynmEntity.sidesAffected = sAffected;
    //console.log(dynmEntity.sidesAffected);
    if(dynmEntity.sidesAffected.up) {//collision on bottom side
        dynmEntity.y = (staticEntity.collider.corner.y + yOff) - dynmEntity.collider.height - COLLISION_GAP;
        dynmEntity.phys2d.velocity.y = 0;
    }else if(dynmEntity.sidesAffected.down){//collision on top side
        dynmEntity.y = (staticEntity.collider.corner.y + yOff) + staticEntity.collider.height + COLLISION_GAP;
        dynmEntity.phys2d.velocity.y = 0;
    }
    if(dynmEntity.sidesAffected.right){//collision on left side
        dynmEntity.x = (staticEntity.collider.corner.x + xOff) + staticEntity.collider.width + COLLISION_GAP;
        dynmEntity.phys2d.velocity.x = 0;
    }else if (dynmEntity.sidesAffected.left) {//collision on right side
        dynmEntity.x = (staticEntity.collider.corner.x + xOff) - dynmEntity.collider.width - COLLISION_GAP;
        dynmEntity.phys2d.velocity.x = 0;
    }
}

const normalizeVector = (vector) => {
    let magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2);
    return magnitude == 0 ? {x: 0, y:0} : {x: vector.x/magnitude, y: vector.y/magnitude};
}

const distance = (point1, point2) => {
    return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
}

const distVect = (point1, point2) => {
    return {x: point2.x - point1.x, y: point2.y - point1.y};
}

const scaleVect = (vector, scalar) =>{
    return {x: vector.x * scalar, y: vector.y * scalar};
}

const addVect = (v1, v2) => {return {x: v1.x +v2.x, y: v1.y + v2.y}};

const drawBoxCollider = (ctx, box, colliding) => {
    ctx.strokeStyle = colliding ? "red" : "green";
    ctx.lineWidth = 2;
    ctx.strokeRect(box.corner.x, box.corner.y, box.width, box.height);
}
