/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated January 1, 2020. Replaces all prior versions.
 *
 * Copyright (c) 2013-2020, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/
import { MeshAttachment } from "./attachments/MeshAttachment";
/** Stores an entry in the skin consisting of the slot index, name, and attachment **/
export class SkinEntry {
    constructor(slotIndex = 0, name = null, attachment = null) {
        this.slotIndex = slotIndex;
        this.name = name;
        this.attachment = attachment;
    }
}
/** Stores attachments by slot index and attachment name.
 *
 * See SkeletonData {@link SkeletonData#defaultSkin}, Skeleton {@link Skeleton#skin}, and
 * [Runtime skins](http://esotericsoftware.com/spine-runtime-skins) in the Spine Runtimes Guide. */
export class Skin {
    constructor(name) {
        /** The skin's name, which is unique across all skins in the skeleton. */
        this.name = null;
        this.attachments = new Array();
        this.bones = Array();
        this.constraints = new Array();
        if (!name)
            throw new Error("name cannot be null.");
        this.name = name;
    }
    /** Adds an attachment to the skin for the specified slot index and name. */
    setAttachment(slotIndex, name, attachment) {
        if (!attachment)
            throw new Error("attachment cannot be null.");
        let attachments = this.attachments;
        if (slotIndex >= attachments.length)
            attachments.length = slotIndex + 1;
        if (!attachments[slotIndex])
            attachments[slotIndex] = {};
        attachments[slotIndex][name] = attachment;
    }
    /** Adds all attachments, bones, and constraints from the specified skin to this skin. */
    addSkin(skin) {
        for (let i = 0; i < skin.bones.length; i++) {
            let bone = skin.bones[i];
            let contained = false;
            for (let ii = 0; ii < this.bones.length; ii++) {
                if (this.bones[ii] == bone) {
                    contained = true;
                    break;
                }
            }
            if (!contained)
                this.bones.push(bone);
        }
        for (let i = 0; i < skin.constraints.length; i++) {
            let constraint = skin.constraints[i];
            let contained = false;
            for (let ii = 0; ii < this.constraints.length; ii++) {
                if (this.constraints[ii] == constraint) {
                    contained = true;
                    break;
                }
            }
            if (!contained)
                this.constraints.push(constraint);
        }
        let attachments = skin.getAttachments();
        for (let i = 0; i < attachments.length; i++) {
            var attachment = attachments[i];
            this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
        }
    }
    /** Adds all bones and constraints and copies of all attachments from the specified skin to this skin. Mesh attachments are not
     * copied, instead a new linked mesh is created. The attachment copies can be modified without affecting the originals. */
    copySkin(skin) {
        for (let i = 0; i < skin.bones.length; i++) {
            let bone = skin.bones[i];
            let contained = false;
            for (let ii = 0; ii < this.bones.length; ii++) {
                if (this.bones[ii] == bone) {
                    contained = true;
                    break;
                }
            }
            if (!contained)
                this.bones.push(bone);
        }
        for (let i = 0; i < skin.constraints.length; i++) {
            let constraint = skin.constraints[i];
            let contained = false;
            for (let ii = 0; ii < this.constraints.length; ii++) {
                if (this.constraints[ii] == constraint) {
                    contained = true;
                    break;
                }
            }
            if (!contained)
                this.constraints.push(constraint);
        }
        let attachments = skin.getAttachments();
        for (let i = 0; i < attachments.length; i++) {
            var attachment = attachments[i];
            if (!attachment.attachment)
                continue;
            if (attachment.attachment instanceof MeshAttachment) {
                attachment.attachment = attachment.attachment.newLinkedMesh();
                this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
            }
            else {
                attachment.attachment = attachment.attachment.copy();
                this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
            }
        }
    }
    /** Returns the attachment for the specified slot index and name, or null. */
    getAttachment(slotIndex, name) {
        let dictionary = this.attachments[slotIndex];
        return dictionary ? dictionary[name] : null;
    }
    /** Removes the attachment in the skin for the specified slot index and name, if any. */
    removeAttachment(slotIndex, name) {
        let dictionary = this.attachments[slotIndex];
        if (dictionary)
            dictionary[name] = null;
    }
    /** Returns all attachments in this skin. */
    getAttachments() {
        let entries = new Array();
        for (var i = 0; i < this.attachments.length; i++) {
            let slotAttachments = this.attachments[i];
            if (slotAttachments) {
                for (let name in slotAttachments) {
                    let attachment = slotAttachments[name];
                    if (attachment)
                        entries.push(new SkinEntry(i, name, attachment));
                }
            }
        }
        return entries;
    }
    /** Returns all attachments in this skin for the specified slot index. */
    getAttachmentsForSlot(slotIndex, attachments) {
        let slotAttachments = this.attachments[slotIndex];
        if (slotAttachments) {
            for (let name in slotAttachments) {
                let attachment = slotAttachments[name];
                if (attachment)
                    attachments.push(new SkinEntry(slotIndex, name, attachment));
            }
        }
    }
    /** Clears all attachments, bones, and constraints. */
    clear() {
        this.attachments.length = 0;
        this.bones.length = 0;
        this.constraints.length = 0;
    }
    /** Attach each attachment in this skin if the corresponding attachment in the old skin is currently attached. */
    attachAll(skeleton, oldSkin) {
        let slotIndex = 0;
        for (let i = 0; i < skeleton.slots.length; i++) {
            let slot = skeleton.slots[i];
            let slotAttachment = slot.getAttachment();
            if (slotAttachment && slotIndex < oldSkin.attachments.length) {
                let dictionary = oldSkin.attachments[slotIndex];
                for (let key in dictionary) {
                    let skinAttachment = dictionary[key];
                    if (slotAttachment == skinAttachment) {
                        let attachment = this.getAttachment(slotIndex, key);
                        if (attachment)
                            slot.setAttachment(attachment);
                        break;
                    }
                }
            }
            slotIndex++;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Ta2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0VBMkIrRTtBQUcvRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFNOUQsc0ZBQXNGO0FBQ3RGLE1BQU0sT0FBTyxTQUFTO0lBQ3JCLFlBQW9CLFlBQW9CLENBQUMsRUFBUyxPQUFlLElBQUksRUFBUyxhQUF5QixJQUFJO1FBQXZGLGNBQVMsR0FBVCxTQUFTLENBQVk7UUFBUyxTQUFJLEdBQUosSUFBSSxDQUFlO1FBQVMsZUFBVSxHQUFWLFVBQVUsQ0FBbUI7SUFBSSxDQUFDO0NBQ2hIO0FBRUQ7OzttR0FHbUc7QUFDbkcsTUFBTSxPQUFPLElBQUk7SUFRaEIsWUFBYSxJQUFZO1FBUHpCLHlFQUF5RTtRQUN6RSxTQUFJLEdBQVcsSUFBSSxDQUFDO1FBRXBCLGdCQUFXLEdBQUcsSUFBSSxLQUFLLEVBQXlCLENBQUM7UUFDakQsVUFBSyxHQUFHLEtBQUssRUFBWSxDQUFDO1FBQzFCLGdCQUFXLEdBQUcsSUFBSSxLQUFLLEVBQWtCLENBQUM7UUFHekMsSUFBSSxDQUFDLElBQUk7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVELDRFQUE0RTtJQUM1RSxhQUFhLENBQUUsU0FBaUIsRUFBRSxJQUFZLEVBQUUsVUFBc0I7UUFDckUsSUFBSSxDQUFDLFVBQVU7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDL0QsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNuQyxJQUFJLFNBQVMsSUFBSSxXQUFXLENBQUMsTUFBTTtZQUFFLFdBQVcsQ0FBQyxNQUFNLEdBQUcsU0FBUyxHQUFHLENB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