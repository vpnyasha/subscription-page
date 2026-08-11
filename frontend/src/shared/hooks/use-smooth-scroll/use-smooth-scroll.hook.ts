import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Инерционная прокрутка для мыши.
 *
 * Нативного scroll-behavior: smooth хватает только на переходы по якорям, и
 * ни длительность, ни кривую он не отдаёт. Lenis перехватывает колесо и водит
 * страницу сам, поэтому прокрутка получается с довеском и плавным торможением.
 *
 * На сенсорных устройствах не включается намеренно: там прокруткой управляет
 * браузер, и вместе с ней ездят его бары — перехват ломает и то, и другое.
 */
/*
 * Ссылка на текущий экземпляр нужна для программной прокрутки: пока Lenis водит
 * страницу сам, нативный scrollIntoView он перебивает своим rAF — элемент
 * дёргается и остаётся на месте. На телефоне Lenis выключен, ссылка пустая,
 * и прокрутка идёт обычным путём.
 */
let activeLenis: Lenis | null = null

/** Плавно прокручивает к элементу — через Lenis, если он ведёт страницу. */
export function scrollToElement(element: HTMLElement) {
    if (activeLenis) {
        activeLenis.scrollTo(element, { offset: -16 })
        return
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function useSmoothScroll() {
    useEffect(() => {
        const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')

        if (!pointer.matches || motion.matches) return undefined

        const lenis = new Lenis({
            // Длительность догона: меньше — резче, больше — «ватнее».
            duration: 0.65,
            // Плавное торможение в конце вместо равномерного движения.
            easing: (t: number) => 1 - (1 - t)**3,
            // Свайпы оставляем браузеру, перехватываем только колесо.
            syncTouch: false,
            // Один щелчок колеса проезжает столько же, сколько без Lenis.
            wheelMultiplier: 1.1
        })

        activeLenis = lenis

        let frame = 0

        const raf = (time: number) => {
            lenis.raf(time)
            frame = requestAnimationFrame(raf)
        }

        frame = requestAnimationFrame(raf)

        return () => {
            cancelAnimationFrame(frame)
            lenis.destroy()
            activeLenis = null
        }
    }, [])
}
