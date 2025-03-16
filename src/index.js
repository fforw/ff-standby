import domready from "domready"
import "./style.css"
import perfNow from "performance-now"
import {createNoise2D} from "simplex-noise"
import randomPalette from "./randomPalette"
import Color from "./Color"

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

// create a reference for the wake lock
let wakeLock = null;

let noise
let palette


function lockScreen()
{
    return navigator.wakeLock.request("screen").then(
        lock => {

            wakeLock = lock

            wakeLock.addEventListener("release", () => {
                wakeLock = null
                //console.info("Lost lock")
            });
        }
    )

}


function createSliceBackground(w,h)
{

    const canvas = document.createElement("canvas");
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#000"
    ctx.fillRect(0,0,w,h);

    const w2 = w >> 1


    const count = w * h * 0.0005
    for (let i = 0; i < count; i++)
    {
        const x  = 0|Math.random() * w2
        const y  = 0|Math.random() * h
        const l  = (0|Math.pow(Math.random(), 8) * 3) + 1

        ctx.fillStyle = palette[0|Math.random() * palette.length]
        ctx.fillRect(x, y, l*l, 1);
        ctx.fillRect(x + w2, y, l*l, 1);
    }
    return canvas
}


function createSlices(heightInSlices)

{
    const divs = []

    for (let i = 0; i < heightInSlices; i++)
    {
        const div = document.createElement("div");
        div.className = "slice"

        divs.push(div)
        document.body.appendChild(div);
    }

    return divs;
}


function updatePositions(slices, positions)
{
    const {width} = config

    for (let i = 0; i < slices.length; i++)
    {
        const slice = slices[i]
        slice.style.left = Math.floor(-positions[i]) + "px"
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

let activeRun = 0

domready(
    () => {

        const paint = () => {

            const width = (window.innerWidth) | 0;
            const height = (window.innerHeight) | 0;

            config.width = width;
            config.height = height;

            Array.from(document.querySelectorAll(".slice")).forEach(e => e.parentNode.removeChild(e))

            palette = randomPalette().map(c => Color.from(c).toRGBA(0.85))

            const heightInSlices = 100

            const w = width * 2
            const h = Math.ceil(height / heightInSlices)

            const bg = createSliceBackground(w,h)

            const style = document.createElement("style")
            style.type = 'text/css';
            style.innerText = `.slice { position: relative; width: ${w}px; height: ${h}px; background: url("${bg.toDataURL("image/png")}"); }`;
            document.head.appendChild(style)

            const slices = createSlices(heightInSlices)

            const positions = slices.map(() => Math.random() * width)
            const steps = slices.map(() => (Math.pow(Math.random(), 2) * 4) + 1)

            updatePositions(slices, positions)

            const run = ++activeRun

            const animate = () => {

                for (let i = 0; i < positions.length; i++)
                {
                    let pos = positions[i] + steps[i]

                    if (pos < 0)
                    {
                        pos += width
                    }
                    if (pos > width)
                    {
                        pos -= width
                    }
                    positions[i] = pos
                }
                updatePositions(slices, positions)

                if (run === activeRun)
                {
                    requestAnimationFrame(animate)
                }
            }

            requestAnimationFrame(animate)
        }

        console.log("lock")
        lockScreen()
            .catch(e => console.error("ERROR", e))


        paint()


        window.addEventListener("click", () => {
            toggleFullScreen()
        }, true)

        window.addEventListener("resize", () => {
            paint()
        })

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden && !wakeLock) {

                console.info("Relocking")
                lockScreen().catch(e => console.error("ERROR", e))
            }
        });

    }
);
