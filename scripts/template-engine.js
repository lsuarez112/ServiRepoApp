/**
 * 
 * template-engine.js
 *
 * Sistema de carga dinámica y recursiva de componentes HTML con JavaScript vanilla.
 *
 * Funcionalidad:
 * - Inserta HTML donde haya `data-include="[componente]"`.
 */
export async function buildTemplates() {

    let templatesLoadedCount = 0;
    let foundNewIncludes = true;

    while (foundNewIncludes) {
        foundNewIncludes = false;

        const elements = Array.from(document.querySelectorAll('[data-include]'));
        if (elements.length === 0) break;

        await Promise.all(elements.map(async (el) => {
            const componentName = el.getAttribute('data-include');
            const componentHtmlPath = `components/${componentName}.html?v=${new Date().getTime()}`;

            try {
                //1. Cargar Componete -----
                const html = await fetch(componentHtmlPath).then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.text();
                });

                //2. Crear Componete -----
                const temp = document.createElement('div');
                temp.innerHTML = html;
                el.replaceWith(...Array.from(temp.childNodes));

                templatesLoadedCount++;
                foundNewIncludes = true;

            } catch (err) {
                console.error(`❌ Error al cargar componente: ${componentName}`, err);
            }
        }));
    }
}
