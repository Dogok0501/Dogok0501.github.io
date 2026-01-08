const id = "player";
// const time = 0.25;
const ease = "ease-in-out";

let currX = 0;
const constY = -50;


let senekaPlayer = null;
let bPlayer = null;
let ignore_play_command = false;
document.addEventListener('DOMContentLoaded', function() {
    const area = document.getElementById('seneka-player');
    senekaPlayer = new spine.SpinePlayer("seneka-player", {
        jsonUrl: "spine_resource/seneka.json",
        atlasUrl: "spine_resource/seneka.atlas",
        premultipliedAlpha: false,
        animation: "Idle",
        alpha: true,
        showControls: false,
        interactive: false, // Disable click and touch interactions
        scale: 1,
        success: async function() {
            console.log("seneka 애니메이션 로드 완료");
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (senekaPlayer) senekaPlayer.animationState.setAnimation(0, "Idle", true);
        }
       });
    bPlayer = new spine.SpinePlayer("b-player", {
        jsonUrl: "spine_resource/ScSave_B.json",
        atlasUrl: "spine_resource/ScSave_B.atlas",
        premultipliedAlpha: false,
        animation: "Smoke_ing",
        alpha: true,
        showControls: false,
        interactive: false, // Disable click and touch interactions
        scale: 1,
        success: async function() {
            console.log("B 애니메이션 로드 완료");
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (bPlayer) {
                bPlayer.animationState.setAnimation(0, "Smoke_ing", true);
                bPlayer.animationState.setAnimation(1, "Color_R", true);
            }
        }
    });
    // 외부에서 제어할 수 있도록 전역 API 노출
    window.spineWidget = {
        show() { if (area) { area.style.opacity = '1'; area.style.pointerEvents = 'auto'; }},
        hide() { if (area) { area.style.opacity = '0'; area.style.pointerEvents = 'none'; }},
        moveTo(x, y, duration = 0.3) {
            if (area) {
                area.style.transition = `transform ${duration}s ${ease}`;
                area.style.transform = `translate(${x}px, ${y}px)`;
            }
        },
        behindWidget(enable = true) {
            if (!area) return;
            if (enable) area.classList.add('behind-widget');
            else area.classList.remove('behind-widget');
        },
        play: playAnimation,
        idle: () => playAnimation('Idle')
    };
});

function playAnimation(animationName, after_ignore_sec=0) {
    if (ignore_play_command) {
        return;
    }
    if (after_ignore_sec > 0) {
        ignore_play_command = true;
    }
    if (senekaPlayer) {
        senekaPlayer.animationState.setAnimation(0, animationName, true);
        if (after_ignore_sec > 0) {
            setTimeout(() => {
                ignore_play_command = false;
            }, after_ignore_sec * 1000);
        }
    }
}

function playIdle() {
    playAnimation("Idle");
}

function onMouseEnterToSteam () {
    try {
        const clip = document.querySelector('#about-the-game .seneka-player-clip');
        if (clip) clip.classList.add('is-raised');
        playAnimation("Deride_ing");
    } catch (e) {
        console.error('onMouseEnterToSteam error', e);
    }
}

function onMouseLeaveToSteam () {
    try {
        const clip = document.querySelector('#about-the-game .seneka-player-clip');
        if (clip) clip.classList.remove('is-raised');
        playAnimation("Idle");
    } catch (e) {
        console.error('onMouseLeaveToSteam error', e);
    }
}