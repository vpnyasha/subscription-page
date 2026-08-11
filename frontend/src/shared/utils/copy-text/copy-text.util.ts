/**
 * Копирование с запасным путём. navigator.clipboard доступен только в
 * защищённом контексте: по HTTPS или на localhost. Страницу открывают и по
 * http (dev-сервер по IP, внутренние адреса), и там вызов молча отклоняется —
 * кнопка не переключалась на галочку, хотя пользователь её нажал.
 *
 * Запасной путь — execCommand со скрытым полем. Он объявлен устаревшим, но
 * работает без защищённого контекста и остаётся единственным вариантом.
 */
export async function copyText(text: string): Promise<boolean> {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch {
            // Разрешение могли не дать — пробуем запасной путь.
        }
    }

    const field = document.createElement('textarea')

    field.value = text
    field.setAttribute('readonly', '')

    /*
     * Поле не должно ни мелькать, ни двигать вёрстку, но и display: none не
     * годится — из скрытого элемента выделение не берётся.
     */
    field.style.position = 'fixed'
    field.style.top = '0'
    field.style.opacity = '0'
    field.style.pointerEvents = 'none'

    document.body.appendChild(field)

    try {
        /*
         * Safari на iOS игнорирует select() у readonly-поля, поэтому выделение
         * задаётся диапазоном, а границы — отдельно через setSelectionRange.
         */
        const range = document.createRange()

        range.selectNodeContents(field)

        const selection = window.getSelection()

        selection?.removeAllRanges()
        selection?.addRange(range)
        field.setSelectionRange(0, text.length)

        return document.execCommand('copy')
    } catch {
        return false
    } finally {
        document.body.removeChild(field)
    }
}
