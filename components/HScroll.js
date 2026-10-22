"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * Хэвтээ гүйлгэх мөр — хуруугаар гүйлгэхээс гадна хулганы дугуй, хулганаар чирэх,
 * ‹ › сумаар гүйлгэнэ (компьютер, киоск дээр scrollbar нуугдсан үед хэрэгтэй).
 */
export default function HScroll({ children, className, arrowClassName }) {
    const ref = useRef(null);
    const drag = useRef(null);
    const [edges, setEdges] = useState({ left: false, right: false });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => setEdges({
            left: el.scrollLeft > 4,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
        });
        // Босоо дугуйг хэвтээ гүйлгэлт болгоно (passive биш — хуудсыг гүйлгэхгүй)
        const onWheel = (e) => {
            if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };
        update();
        el.addEventListener("scroll", update, { passive: true });
        el.addEventListener("wheel", onWheel, { passive: false });
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", update);
            el.removeEventListener("wheel", onWheel);
            ro.disconnect();
        };
    }, []);

    // Хулганаар чирэх (touch-д browser өөрөө гүйлгэнэ)
    const onPointerDown = (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
    };
    const onPointerMove = (e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (!d.moved && Math.abs(dx) > 5) {
            d.moved = true;
            ref.current.setPointerCapture(e.pointerId);
        }
        if (d.moved) ref.current.scrollLeft = d.left - dx;
    };
    const onPointerUp = (e) => {
        if (drag.current?.moved && ref.current.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    };
    // Чирсний дараах click-ийг (товч сонгох) цуцална
    const onClickCapture = (e) => {
        if (drag.current?.moved) { e.stopPropagation(); e.preventDefault(); }
        drag.current = null;
    };

    const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });

    return (
        <div className="relative pointer-events-auto">
            <div
                ref={ref}
                className={clsx("overflow-x-auto no-scrollbar select-none", className)}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => { drag.current = null; }}
                onClickCapture={onClickCapture}
            >
                {children}
            </div>
            {[-1, 1].map((dir) => {
                const show = dir < 0 ? edges.left : edges.right;
                return (
                    <button
                        key={dir}
                        type="button"
                        aria-label={dir < 0 ? "Өмнөх" : "Дараах"}
                        onClick={() => scrollBy(dir)}
                        tabIndex={show ? 0 : -1}
                        className={clsx(
                            "absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center",
                            "bg-slate-900/90 border border-white/15 text-white shadow-lg backdrop-blur-md transition-opacity duration-200",
                            dir < 0 ? "left-0" : "right-0",
                            show ? "opacity-100" : "opacity-0 pointer-events-none",
                            arrowClassName
                        )}
                    >
                        <i className={`fa-solid ${dir < 0 ? "fa-chevron-left" : "fa-chevron-right"} text-[10px]`}></i>
                    </button>
                );
            })}
        </div>
    );
}
