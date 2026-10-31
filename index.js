import WebSocketManager from "./js/socket.js";
const socket = new WebSocketManager("127.0.0.1:24050");
socket.sendCommand(
    "getSettings",
    encodeURI(window.COUNTER_PATH)
);
/* ==========================================================
   Config
========================================================== */

const CONFIG = {

    decimals: 3,

    largeNumber: 10000,

    timeout: 1000,

    

};
const DEBUG = false;

// Developer Tools
const DEBUG_LOG_RESULT = false


/* ==========================================================
   DOM
========================================================== */

const UI = {

    container: document.getElementById("container"),

    ratio300: document.getElementById("ratio300"),
    ratioErr: document.getElementById("ratioErr"),

    labels: [...document.querySelectorAll(".label")],

    values: [...document.querySelectorAll(".value")],

    balances: [
        document.getElementById("balance300"),
        document.getElementById("balanceErr")
    ],

    balance300: document.getElementById("balance300"),
    balanceErr: document.getElementById("balanceErr")

};

UI.labels[0].title = "Yellow 300 / Rainbow 300";
UI.labels[1].title = "Equivalent Yellow 300 / Rainbow 300";
let debugBox = null;

if (DEBUG) {

    debugBox = document.createElement("pre");

    debugBox.style.position = "fixed";
    debugBox.style.left = "20px";
    debugBox.style.top = "800px";
    debugBox.style.zIndex = "99999";
    debugBox.style.color = "#ffffff";
    debugBox.style.fontSize = "22px";
    debugBox.style.fontFamily = "Consolas, monospace";
    debugBox.style.pointerEvents = "none";
    debugBox.style.whiteSpace = "pre";

    document.body.appendChild(debugBox);

}
UI.groups = {

    label: document.querySelectorAll(".label"),

    value: document.querySelectorAll(".value"),

    balance: document.querySelectorAll(".balance")

};
/* ==========================================================
   Runtime
========================================================== */

const Settings={

    targetTopRatio:1,

    targetBottomRatio:1,

    enableJudgeColor:true,

    enableJudgeGlow:true,

    enableDangerAnimation:true,

    showLabel:true,

    showBalance:true,

    showTargetRatio:true,

    rainbowMode:"Animated", 
    
    displayMode: "Both",

    balancecolorinverse:false,

    labelFontSize:14,
    ratioFontSize:34,
    balanceFontSize:20,

    labelFontWeight:"Normal",
    ratioFontWeight:"Bold",
    balanceFontWeight:"Bold",

    
};

const Runtime = {

   lastUpdateObjects: 0,

    visible: false,
    
    started: false,

    lastPacket: 0,

    lastState: "",

    previousState: "",

    lastMode: "",

    inPlay: false,

    inResult: false,
    lastObjects: 0,
    objects: 0,

    topBalance: 0,

    bottomBalance: 0,

   topDanger: false,
    bottomDanger: false,

    lastTopDanger: false,
    lastBottomDanger: false,
    
   
}
const FONT_WEIGHT = {
    Normal: 400,
    Medium: 500,
    SemiBold: 600,
    Bold: 700
};

/* ==========================================================
   Show / Hide
========================================================== */

function show(){

    if(Runtime.visible) return;

    Runtime.visible = true;

    UI.container.style.opacity = "1";
    applySettings();

}

function hide(){

    if(!Runtime.visible) return;

    Runtime.visible = false;

    UI.container.style.opacity = "0";

}
function updateDebug(){

    if(!DEBUG || !debugBox) return;

    debugBox.textContent =
    debugBox.textContent =
`
UpdateObj : ${Runtime.lastUpdateObjects}
Infinity : ${Runtime.showInfinityCount}
State    : ${Runtime.lastState}
Previous : ${Runtime.previousState}
LastObj  : ${Runtime.lastObjects}
Objects  : ${Runtime.objects}
SetTop   : ${Runtime.debugTop}
SetBottom: ${Runtime.debugBottom}
Started  : ${Runtime.started}
Visible  : ${Runtime.visible}
Label0 : ${UI.labels[0].className}
Value0 : ${UI.values[0].className}
Label1 : ${UI.labels[1].className}
Value1 : ${UI.values[1].className}
TopBalance : ${formatBalance(Runtime.topBalance)}
BottomBal  : ${formatBalance(Runtime.bottomBalance)}
Max        : ${Runtime.debugMax}
Yellow300  : ${Runtime.debugYellow}
Eq300      : ${Runtime.debugEq}
TopCalc    : ${Runtime.debugTopCalc}
BottomCalc : ${Runtime.debugBottomCalc}
`

}

/* ==========================================================
   Helpers
========================================================== */

function formatRatio(value){

    if(value===Infinity){

        return "∞";

    }

    if(value>=CONFIG.largeNumber){

        return value.toFixed(0);

    }

    return value.toFixed(CONFIG.decimals);

}

function totalObjects(h){

    return (

        (h.geki??0)+
        (h["300"]??0)+
        (h.katu??0)+
        (h["100"]??0)+
        (h["50"]??0)+
        (h["0"]??0)

    );

}

function isMania(mode){

    if(!mode){

        return false;

    }

    if(typeof mode==="string"){

        return mode.toLowerCase()==="mania";

    }

    if(typeof mode.name==="string"){

        return mode.name.toLowerCase()==="mania";

    }

    return false;

}
 
function logResult(h){

    const max = h.geki ?? 0;

    const yellow = h["300"] ?? 0;

    const eq = equivalent300(h);

    console.log(
        [
            new Date().toISOString(),

            max,
            yellow,
            h.katu ?? 0,
            h["100"] ?? 0,
            h["50"] ?? 0,
            h["0"] ?? 0,

            formatRatio(ratio(max, yellow)),
            formatRatio(ratio(max, eq)),

            Runtime.topBalance,
            Runtime.bottomBalance

        ].join(",")
    );

}
function applySettings(){

    // Label
    UI.labels.forEach(e=>{
        e.style.display =
            Settings.showLabel ? "" : "none";
    });

    // Ratio
    UI.values.forEach(e=>{
        e.style.display =
            Settings.showTargetRatio ? "" : "none";
    });

    // Balance
    UI.balances.forEach(e=>{
        e.style.display =
            Settings.showBalance ? "" : "none";
    });

}
/* ==========================================================
   Calculate
========================================================== */

const EQ_WEIGHT = {


    yellow300: 1,

    p200: 21,

    p100: 41,

    p50: 51,

    miss: 61

};

function equivalent300(h){

    return (

        (h["300"] ?? 0) * EQ_WEIGHT.yellow300 +

        (h.katu ?? 0) * EQ_WEIGHT.p200 +

        (h["100"] ?? 0) * EQ_WEIGHT.p100 +

        (h["50"] ?? 0) * EQ_WEIGHT.p50 +

        (h["0"] ?? 0) * EQ_WEIGHT.miss

    );

}

function ratio(max,value){

    if(value<=0){

        return Infinity;

    }

    return max/value;

}
function calculateBalance(max, value, targetRatio = 1){

    return max - value * targetRatio;

}

function formatBalance(balance){

    const display = Math.floor(balance);

    return display >= 0
        ? "+" + display
        : String(display);

}

function bottomJudgeColor(h){
        
    
    if((h["0"] ?? 0)>0){

    return "miss";

    }
    if((h["50"] ?? 0)>0){

        return "p50";

    }

    if((h["100"] ?? 0)>0){

        return "p100";

    }

    if((h.katu ?? 0)>0){

        return "p200";

    }

    if((h["300"] ?? 0)>0){

        return "yellow300";

    }

    return "rainbow300";

}
function topJudgeColor(h){

    if((h["300"] ?? 0) > 0){

        return "yellow300";

    }

    return "rainbow300";

}
function applyJudgeClass(
    label,
    value,
    judge,
    danger
  ){

    const judgeClasses=[

        "judge-rainbow300",
        "judge-yellow300",
        "judge-p200",
        "judge-p100",
        "judge-p50",
        "judge-miss"

    ];

    const glowClasses=[

    "glow-high",
    "glow-mid",
    "glow-low",
    "glow-none",

    "superglow",
    

    ];

    label.classList.remove(...judgeClasses,...glowClasses);
    value.classList.remove(...judgeClasses,...glowClasses);

    if(Settings.enableJudgeColor){

    label.classList.add("judge-"+judge);
    value.classList.add("judge-"+judge);

 }
 if(
    judge==="rainbow300" &&
    Settings.rainbowMode==="Animated"
 ){
    label.classList.add("superglow");
    value.classList.add("superglow");
 }

    let glow = "glow-none";

    if(!danger){

    switch(judge){

        case "yellow300":
            glow = "glow-high";
            break;

        case "p200":
        case "p100":
            glow = "glow-mid";
            break;

        case "p50":
        case "miss":
            glow = "glow-low";
            break;

    }

    }

 if(Settings.enableJudgeGlow){

    label.classList.add(glow);
    value.classList.add(glow);

 }
}
function isDanger(balance){

    return balance < 0;
    

}


function setJudgeRainbow(topJudge, bottomJudge){

    [
        UI.labels[0], UI.values[0],
        UI.labels[1], UI.values[1]
    ].forEach(element=>{

        element.classList.remove(
            "rainbow-animation",
            "rainbow-static"
        );

    });

    function apply(element, judge){

        if(judge !== "rainbow300") return;

        switch(Settings.rainbowMode){

            case "Animated":
                element.classList.add("rainbow-animation");
                break;

            case "Static":
                element.classList.add("rainbow-static");
                break;

            case "Off":
            default:
                break;

        }

    }

    apply(UI.labels[0], topJudge);
    apply(UI.values[0], topJudge);

    apply(UI.labels[1], bottomJudge);
    apply(UI.values[1], bottomJudge);

}


function setJudgeVisual(

    topJudge,
    bottomJudge,

    topDanger,
    bottomDanger

){

    applyJudgeClass(

        UI.labels[0],
        UI.values[0],

        topJudge,
        topDanger

    );

    applyJudgeClass(

        UI.labels[1],
        UI.values[1],

        bottomJudge,
        bottomDanger

    );

    setJudgeRainbow(

        topJudge,
        bottomJudge

    );

}

function showInfinity(){
    Runtime.showInfinityCount =
    (Runtime.showInfinityCount ?? 0) + 1;

    UI.ratio300.textContent="1 : ∞";

    UI.ratioErr.textContent="1 : ∞";

    setJudgeVisual(

    "rainbow300",
    "rainbow300",

    false,
    false
  
);

    UI.balance300.textContent = "+0";
UI.balanceErr.textContent = "+0";

updateBalanceColor(UI.balance300, 0);
updateBalanceColor(UI.balanceErr, 0);
if(Settings.balancecolorinverse===true){
UI.balance300.classList.remove(
    "balance-green"
);

UI.balance300.classList.add(
    "balance-red"
);

UI.balanceErr.classList.remove(
    "balance-green"
);

UI.balanceErr.classList.add(
    "balance-red"
);

}
else{
UI.balance300.classList.remove(
    "balance-red"
);

UI.balance300.classList.add(
    "balance-green"
);

UI.balanceErr.classList.remove(
    "balance-red"
);

UI.balanceErr.classList.add(
    "balance-green"
);
}
applySettings();
}
function update(h){
    Runtime.lastUpdateObjects = totalObjects(h);
   
    const max = h.geki ?? 0;

    // 只有完全没有任何判定时才保持 Infinity
    if(totalObjects(h) === 0){
       
        return;
    }

    const yellow = h["300"] ?? 0;

    const eq = equivalent300(h);
   
    Runtime.debugMax = max;
    Runtime.debugYellow = yellow;
    Runtime.debugEq = eq;

    const topBalance = calculateBalance(
    max,
    yellow,
    Settings.targetTopRatio
);

const bottomBalance = calculateBalance(
    max,
    eq,
    Settings.targetBottomRatio
);

Runtime.topBalance = topBalance;
Runtime.bottomBalance = bottomBalance;
Runtime.debugTopCalc = topBalance;
Runtime.debugBottomCalc = bottomBalance;
const topDanger = isDanger(topBalance);

const bottomDanger = isDanger(bottomBalance);
Runtime.lastTopDanger = Runtime.topDanger;
Runtime.lastBottomDanger = Runtime.bottomDanger;

Runtime.topDanger = topDanger;
Runtime.bottomDanger = bottomDanger;

UI.balance300.textContent =
    formatBalance(topBalance);

UI.balanceErr.textContent =
    formatBalance(bottomBalance);

    UI.ratio300.textContent =
        `1 : ${formatRatio(ratio(max,yellow))}`;

    UI.ratioErr.textContent =
        `1 : ${formatRatio(ratio(max,eq))}`;
        setJudgeVisual(

    topJudgeColor(h),
    bottomJudgeColor(h),

    topDanger,
    bottomDanger

);
if(Runtime.topDanger !== Runtime.lastTopDanger){
if(Settings.enableDangerAnimation){
    pulse(
        UI.labels[0],
        UI.values[0],
        Runtime.topDanger
    );
}
}

if(Runtime.bottomDanger !== Runtime.lastBottomDanger){
if(Settings.enableDangerAnimation){
    pulse(
        UI.labels[1],
        UI.values[1],
        Runtime.bottomDanger
    );
}
}
    updateBalanceColor(
    UI.balance300,
    topBalance
    );

    updateBalanceColor(
    UI.balanceErr,
    bottomBalance
);
}
function updateBalanceColor(element, balance){

    element.classList.remove(
        "balance-green",
        "balance-red"
    );
    if(Settings.balancecolorinverse===true){
        if(balance >= 0){

        element.classList.add("balance-red");

    }else{

        element.classList.add("balance-green");
         }}
    else{
        if(balance >= 0){

        element.classList.add("balance-green");
        }
    else{

        element.classList.add("balance-red");

    }}}
    
    

function pulse(label, value, danger){

    const pulseClass =
        danger
            ? "pulse-danger"
            : "pulse-safe";

    const colorClass =
        danger
            ? "danger-color"
            : "safe-color";

    [label, value].forEach(element=>{

        element.classList.remove(
            "pulse-danger",
            "pulse-safe",
            "danger-color",
            "safe-color"
        );

        void element.offsetWidth;

        element.classList.add(
            pulseClass,
            colorClass
        );

        element.addEventListener(
            "animationend",
            function handler(){

                element.classList.remove(
                    pulseClass,
                    colorClass
                );

                element.removeEventListener(
                    "animationend",
                    handler
                );

            }
        );

    });


}
function applyFont(){

    UI.groups.label.forEach(e=>{

        e.style.fontSize =
            Settings.labelFontSize+"px";

        e.style.fontWeight =
    FONT_WEIGHT[Settings.labelFontWeight];

    });

    UI.groups.value.forEach(e=>{

        e.style.fontSize =
            Settings.ratioFontSize+"px";
        e.style.fontWeight =
            FONT_WEIGHT[Settings.ratioFontWeight];

    });

    UI.groups.balance.forEach(e=>{

        e.style.fontSize =
            Settings.balanceFontSize+"px";

        e.style.fontWeight =
            FONT_WEIGHT[Settings.balanceFontWeight];

    });

}
/* ==========================================================
   WebSocket
========================================================== */
socket.commands((data)=>{

    const { command, message } = data;
    console.log(data);       // ← 放这里
    console.log(command);    // ← 放这里
    console.log(message);    // ← 放这里

    if(command !== "getSettings") return;

    Settings.showLabel = message.showLabel;
    Settings.showBalance = message.showBalance;
    Settings.showTargetRatio = message.showTargetRatio;

    Settings.enableJudgeColor = message.enableJudgeColor;
    Settings.enableJudgeGlow = message.enableJudgeGlow;
    Settings.enableDangerAnimation = message.enableDangerAnimation;

    Settings.rainbowMode = message.rainbowMode;
    Settings.targetTopRatio =
    Number(message.targetTopRatio);

    Settings.targetBottomRatio =
    Number(message.targetBottomRatio);
    Settings.displayMode =
    message.displayMode;
    Settings.balancecolorinverse = message.balancecolorinverse;
    Settings.labelFontSize =
    Number(message.labelFontSize);

    Settings.ratioFontSize =
    Number(message.ratioFontSize);

    Settings.balanceFontSize =
    Number(message.balanceFontSize);

    Settings.labelFontWeight =
    message.labelFontWeight;

    Settings.ratioFontWeight =
    message.ratioFontWeight;

    Settings.balanceFontWeight =
    message.balanceFontWeight;
    applyFont();
    applySettings();
});
socket.api_v2((data)=>{

    Runtime.lastPacket = Date.now();

    const state = data.state?.name ?? "";
    Runtime.previousState = Runtime.lastState;
    Runtime.lastState = state;

  /* ------------------------------------------------------
   PLAY
------------------------------------------------------ */

if(state === "play"){
   
    if ( Settings.displayMode === "Result") {
    hide();
    return;
    }

    const mode = data.play?.mode;

    if(!isMania(mode)){
        hide();
        updateDebug();
        return;
    }

    show();

    const hits = data.play?.hits;

    if(!hits){
        updateDebug();
        return;
    }

const total = totalObjects(hits);

// 保存上一包 Objects
Runtime.lastObjects = Runtime.objects;

// 更新这一包
Runtime.objects = total;

// 如果上一包有物件，这一包突然变 0，说明重试或重新开始
if (
    Runtime.lastObjects > 0 &&
    Runtime.objects === 0
) {

    Runtime.started = false;

    showInfinity();

    updateDebug();

    return;
}

Runtime.topJudge = topJudgeColor(hits);
Runtime.bottomJudge = bottomJudgeColor(hits);

if(total === 0){

    if(!Runtime.started){
        showInfinity();
    }

    updateDebug();
    return;
}

Runtime.started = true;
if(
    DEBUG_LOG_RESULT &&
    Runtime.lastLoggedResult !== Runtime.objects
){

    Runtime.lastLoggedResult = Runtime.objects;

    logResult(hits);

}
update(hits);

updateDebug();

return;

}

    /* ------------------------------------------------------
       RESULT
    ------------------------------------------------------ */

    if(state === "resultScreen"){
        
        if (Settings.displayMode === "Gameplay") {
            hide();
            return;
        }
        const hits = data.resultsScreen?.hits;

        // 没有判定直接隐藏
        if(!hits){

            hide();
            updateDebug();
            return;

        }

        // Mania 一定有 geki
        if(hits.geki === 0){

            hide();
            updateDebug();
            return;

        }

       Runtime.lastObjects = Runtime.objects;
       Runtime.objects = totalObjects(hits);

    

     show();

     update(hits);
        updateDebug();
        return;

    }

    /* ------------------------------------------------------
       MENU / SONGSELECT / IDLE
    ------------------------------------------------------ */
Runtime.started = false;
Runtime.lastLoggedResult = 0;
Runtime.loggedThisResult = false;
Runtime.lastObjects = Runtime.objects;
Runtime.objects = 0;

Runtime.topJudge = null;

Runtime.bottomJudge = null;

hide();
updateDebug();

});

