var DEBUG = 0;

/**
 * @author Christopher Henderson
 */
class Animation {
    /**@access PRIVATE so don't use*/
    constructor(id, spriteSet, fSequence, fTiming, x_offset, y_offset) {
        if (fSequence.length !== fTiming.length)
            throw new Error('Animation: fSequence and fTiming are not same length');

        Object.assign(this, { id, spriteSet, fSequence, fTiming, x_offset, y_offset });
        this.fCount = this.fSequence.length;
        this.init();
    }

    init() {
        this.fTiming_mod = [...this.fTiming];
        this.fSequence_mod = [...this.fSequence];
        this.x_offset_mod = this.x_offset;
        this.y_offset_mod = this.y_offset;

        this.tempo = 1;
        this.elapsedTime = 0;
        this.currFrame = 0;
        this.nextFrameAt = this.fTiming_mod[0] * this.tempo;
        this.looping = true;
    }

    reset() {
        this.elapsedTime = 0;
        this.currFrame = 0;
        this.nextFrameAt = this.fTiming_mod[0] * this.tempo;
    }

    clone(clones_id) {
        return new Animation(
            clones_id, this.spriteSet, 
            this.fSequence, this.fTiming,
            this.x_offset, this.y_offset
        );
    }

    mirrorAnimation_Horz(new_x_offsets_sprite, new_x_offset_anima) {
        const cloneID = (this.spriteSet.get_id() + '_clone');
        const spriteSetClone = this.spriteSet.clone(cloneID);
        spriteSetClone.mirrorSet_Horz();
        if (!(new_x_offsets_sprite === undefined)) 
            spriteSetClone.set_x_offsets(new_x_offsets_sprite);
        if (!(new_x_offset_anima === undefined))
            this.x_offset = new_x_offset_anima;
        this.spriteSet = spriteSetClone;
        this.init();
        
    }

    getFrameDimensions(log = false) {
        return spriteSet.getSpriteDimensions(this.currFrame, log);
    }

    setLooping(looping) {
        this.looping = looping;
    }

    setAnimaSpeed(animationSpeed) {
        this.tempo = 100 / animationSpeed;
    }

    reverseAnima() {
        this.fTiming_mod.reverse();
        this.fSequence_mod.reverse();
    }

    calcFrame() {
        if (this.elapsedTime >= this.nextFrameAt) {
            if (this.currFrame < this.fCount - 1) {
                this.currFrame++;
                this.nextFrameAt += this.fTiming_mod[this.currFrame] * this.tempo;
            }
            else if (this.looping) this.reset();
            // else just keep returning the last frame
        }
        return this.fSequence_mod[this.currFrame];
    }

    animate(tick, ctx, dx, dy, xScale = 1, yScale = xScale) {
        let frameNum = this.calcFrame();
        this.spriteSet.drawSprite(ctx, frameNum, dx + this.x_offset_mod, dy + this.y_offset_mod, xScale, yScale)

        if (DEBUG >= 1) {
            ctx.lineWidth = 1;
            ctx.fillStyle = "rgba(100, 220, 255, 1)";
            ctx.strokeStyle = "rgba(50, 255, 50, 0.8)";
            ctx.font = '10px monospace';

            ctx.fillText('f:' + this.fSequence[this.currFrame], dx + 25, dy - 5); // animation frame number

            let dur = Math.floor(this.fTiming_mod[this.currFrame] * 1000);
            ctx.fillText('ms:' + dur, dx + 50, dy - 5); // animation frame duration in milliseconds
        }

        this.elapsedTime += tick;

    }
}