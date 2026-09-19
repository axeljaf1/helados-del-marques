const xmlInput = document.getElementById("xmlInput");
const dropZone = document.getElementById("dropZone");
const fileName = document.getElementById("fileName");

const resultSection = document.getElementById("resultSection");
const output = document.getElementById("output");

const copyButton = document.getElementById("copyButton");
const downloadButton = document.getElementById("downloadButton");


/*
    Cuando seleccionamos un archivo
*/

xmlInput.addEventListener("change", function () {

    if (!this.files.length) return;

    processFile(this.files[0]);

});


/*
    Drag & Drop
*/

dropZone.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropZone.classList.add("dragover");

});


dropZone.addEventListener("dragleave", function () {

    dropZone.classList.remove("dragover");

});


dropZone.addEventListener("drop", function (event) {

    event.preventDefault();

    dropZone.classList.remove("dragover");

    const file = event.dataTransfer.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xml")) {

        alert("Selecciona un archivo XML.");

        return;
    }

    processFile(file);

});


/*
    Procesar XML
*/

function processFile(file) {

    fileName.textContent = file.name;

    const reader = new FileReader();

    reader.onload = function (event) {

        const xmlText = event.target.result;

        try {

            const parser = new DOMParser();

            const xml = parser.parseFromString(
                xmlText,
                "application/xml"
            );

            const error = xml.querySelector("parsererror");

            if (error) {

                throw new Error(
                    "El archivo XML no es válido."
                );

            }

            const text = xmlToPlainText(xml);

            output.textContent = text;

            resultSection.classList.remove("hidden");

            resultSection.scrollIntoView({
                behavior: "smooth"
            });

        } catch (error) {

            alert(
                "No se pudo procesar el XML:\n\n" +
                error.message
            );

        }

    };

    reader.readAsText(file);

}


/*
    Convierte XML en texto plano organizado
*/

function xmlToPlainText(xml) {

    const lines = [];

    function processNode(node, level = 0) {

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        const children = Array.from(node.children);

        const text = Array.from(node.childNodes)
            .filter(child =>
                child.nodeType === Node.TEXT_NODE
            )
            .map(child => child.textContent.trim())
            .filter(Boolean)
            .join(" ");

        const indent = "  ".repeat(level);

        /*
            Si es un elemento con texto directo
        */

        if (text && children.length === 0) {

            lines.push(
                `${indent}${node.tagName}: ${text}`
            );

        } else {

            lines.push(
                `${indent}${node.tagName}`
            );

            /*
                Atributos
            */

            if (node.attributes.length) {

                for (const attribute of node.attributes) {

                    lines.push(
                        `${indent}  ${attribute.name}: ${attribute.value}`
                    );

                }

            }

            /*
                Hijos
            */

            for (const child of children) {

                processNode(child, level + 1);

            }
        }
    }

    processNode(xml.documentElement);

    return lines.join("\n");
}


/*
    COPIAR
*/

copyButton.addEventListener("click", async function () {

    try {

        await navigator.clipboard.writeText(
            output.textContent
        );

        const original = copyButton.textContent;

        copyButton.textContent = "Copiado ✓";

        setTimeout(() => {

            copyButton.textContent = original;

        }, 1800);

    } catch {

        alert("No se pudo copiar el contenido.");

    }

});


/*
    DESCARGAR TXT
*/

downloadButton.addEventListener("click", function () {

    const text = output.textContent;

    const blob = new Blob(
        [text],
        {
            type: "text/plain;charset=utf-8"
        }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "resultado.txt";

    link.click();

    URL.revokeObjectURL(url);

});
