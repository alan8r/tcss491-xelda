class Knight {
    constructor(x, y) {
        Object.assign(this, {x, y});

        this.state = 0;  // 0:idle,  1:walking, 2:attacking
        this.facing = 1; // 0:north, 1:south,   2:east, 3:west
        this.attackHitCollector = [];

        this.currButton = 0;
        this.elapsedTime = 0;
        this.nextChange = 1;

        this.animations = [];
        this.setupAnimations();

        this.phys2d = {static: false, velocity: {x: 0, y: 0}};
        this.tag = "enemy";
    }

    setupAnimations() {
        this.animations = Array(1);
        this.animations[0] = [
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_north'),
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_south'),
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_east'),
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_west')
        ]
        this.animations[1] = [
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_north'),
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_south'),
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_east'),
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_west')
        ]
        this.animations[2] = [
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_north'),
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_south'),
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_east'),
            ANIMANAGER.getAnimation('ANIMA_blue_enemy_west')
        ]
    }


    updateState() {
        if (this.phys2d.velocity.x != 0 || this.phys2d.velocity.y != 0) this.state = 1;
        else this.state = 0;
    }

    update() {
        let prevFacing = this.facing;
        this.sidesAffected = undefined;

        this.elapsedTime += gameEngine.clockTick;

        if (this.elapsedTime > this.nextChange) {
            this.nextChange += 1;
            this.currButton = Math.floor(Math.random * 4);
        }

        // this.currButton --> 0 = w  | 1 = s  |  2 = d  |  3 = a
        
        if (this.currButton === 0)      [this.facing, this.state, this.phys2d.velocity.y] = [0, 1, -Player.MAX_VEL];
        else if (this.currButton === 1) [this.facing, this.state, this.phys2d.velocity.y] = [1, 1, Player.MAX_VEL];
        else                            this.phys2d.velocity.y = 0;
        
        if (this.currButton === 2)      [this.facing, this.state, this.phys2d.velocity.x] = [2, 1, Player.MAX_VEL];
        else if (this.currButton === 3) [this.facing, this.state, this.phys2d.velocity.x] = [3, 1, -Player.MAX_VEL];
        else                            this.phys2d.velocity.x = 0;

        // if(gameEngine.keys["j"] && this.state != 2) {this.state = 2; console.log('attacking...');}

        // if(this.state == 2) this.processAttack();

        this.phys2d.velocity = normalizeVector(this.phys2d.velocity);
        this.phys2d.velocity.x *= Player.MAX_VEL * gameEngine.clockTick;
        this.phys2d.velocity.y *= Player.MAX_VEL * gameEngine.clockTick;

        // if(this.state != 2) this.updateState();

        let prevX = this.x;
        let prevY = this.y;

        this.x += this.phys2d.velocity.x;
        this.y += this.phys2d.velocity.y;
        this.updateCollider();
        this.collisionChecker(prevX, prevY);

        // gameEngine.currMap.screenEdgeTransition(this);
    };

    /**
     * Called once per tick after adjusting player position
     * @param {*} prevX x value before velocity was applied
     * @param {*} prevY y value before velocity was applied
     */
    collisionChecker(prevX, prevY) {
        this.colliding = false;//.sort((e1, e2) => -(distance(e1, this) - distance(e2, this)))
        gameEngine.scene.env_entities.forEach(entity => {
            if(entity.collider != undefined && entity.collider.type === "box" && entity != this){
                //Check to see if player is colliding with entity
                let colliding = checkCollision(this, entity);
                this.colliding = colliding || this.colliding;//store for later purposes
                //check to see if the collision entity is solid and the type of entity we are looking for
                if(colliding && entity.phys2d && entity.phys2d.static && entity.tag == "environment"){
                    dynmStaticColHandler(this, entity, prevX, prevY);//Handle collision
                    this.updateCollider();
                    //prevX = this.x;
                    //prevY = this.y;
                }
            }
        });
    }

    updateCollider(){
        this.collider = {type: "box", corner: {x: this.x, y: (this.y + 28)}, width: 56, height: 56};
    }

    drawCollider(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.collider.corner.x, this.collider.corner.y);
        ctx.lineWidth = 5;
        ctx.strokeStyle = this.sidesAffected.down ? "green" : "red";
        ctx.lineTo(this.collider.corner.x + this.collider.width, this.collider.corner.y);
        ctx.stroke();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.moveTo(this.collider.corner.x + this.collider.width, this.collider.corner.y);
        ctx.strokeStyle = this.sidesAffected.left ? "green" : "red";
        ctx.lineTo(this.collider.corner.x + this.collider.width, this.collider.corner.y + this.collider.height);
        ctx.stroke();
        ctx.closePath();

        
        ctx.beginPath();
        ctx.moveTo(this.collider.corner.x + this.collider.width, this.collider.corner.y + this.collider.height);
        ctx.strokeStyle = this.sidesAffected.up ? "green" : "red";
        ctx.lineTo(this.collider.corner.x, this.collider.corner.y + this.collider.height);
        ctx.stroke();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.moveTo(this.collider.corner.x, this.collider.corner.y + this.collider.height);
        ctx.strokeStyle = this.sidesAffected.right ? "green" : "red";
        ctx.lineTo(this.collider.corner.x, this.collider.corner.y);
        ctx.stroke();
        ctx.closePath();
    }

    draw(ctx, scale) {
        this.animations[this.state][this.facing].animate(gameEngine.clockTick, ctx, this.x, this.y, scale);
        if(this.colliding && this.sidesAffected) this.drawCollider(ctx);
    }
}