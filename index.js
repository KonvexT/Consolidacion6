const http = require("http");
const url = require("url");
const { v4: uuidv4 } = require("uuid");
const { readFileSync, writeFileSync } = require("fs");
const port = 3000;

const dataAnimes = `${__dirname}/data/anime.json`;

const server = http.createServer((req, res) => {
    const metodo = req.method;
    const urlParsed = url.parse(req.url, true);
    const pathName = urlParsed.pathname;

    if (pathName == "/animes") {
        if (metodo == "GET") {
            res.setHeader("Content-Type", "application/json");
            const params = urlParsed.query;
            const contentString = readFileSync(dataAnimes, "utf-8");
            let contentJS = JSON.parse(contentString);

            if (params.id || params.nombre) {
                // Buscar anime por ID o nombre
                const anime = Object.entries(contentJS).find(([key, anime]) => {
                    if (params.id && key == params.id) return true; // Buscar por ID (clave)
                    if (params.nombre && anime.nombre.toLowerCase() == params.nombre.toLowerCase()) return true; // Buscar por nombre
                    return false;
                });

                if (anime) {
                    return res.end(JSON.stringify({ message: "Anime encontrado", data: anime[1] }));
                } else {
                    res.writeHead(404);
                    return res.end(JSON.stringify({ message: "Anime no encontrado" }));
                }
            }

            // Listar todos los animes
            res.end(JSON.stringify({ message: "Listado de todos los animes", data: Object.values(contentJS) }));
        } else if (metodo == "POST") {
            let body = "";

            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => {
                res.setHeader("Content-Type", "application/json");

                body = JSON.parse(body);

                const contentString = readFileSync(dataAnimes, "utf-8");
                const contentJS = JSON.parse(contentString);

                const encontrado = Object.values(contentJS).some(anime => {
                    return String(anime.nombre).toLowerCase() == String(body.nombre).toLowerCase();
                });

                if (encontrado) {
                    res.writeHead(409);
                    return res.end(JSON.stringify({ message: "No es posible registrar, el anime ya existe en nuestros registros" }));
                }

                const id = Object.keys(contentJS).length + 1;

                const anime = {
                    nombre: body.nombre,
                    genero: body.genero,
                    anio: body.anio,
                    autor: body.autor
                };

                contentJS[id] = anime;
                writeFileSync(dataAnimes, JSON.stringify(contentJS), "utf-8");

                res.writeHead(201);
                res.end(JSON.stringify({ message: "Registro exitoso", data: anime }));
            });

        } else if (metodo == "PUT") {
            res.setHeader("Content-Type", "application/json");
            let body = "";

            req.on("data", (parte) => {
                body += parte.toString();
            });

            req.on("end", () => {
                body = JSON.parse(body);

                const contentString = readFileSync(dataAnimes, "utf-8");
                let contentJS = JSON.parse(contentString);

                if (contentJS[body.id]) {

                    const encontrado = Object.values(contentJS).some(anime => {
                        return String(anime.nombre).toLowerCase() == String(body.nombre).toLowerCase() && anime.id != body.id;
                    });

                    if (encontrado) {
                        res.writeHead(409);
                        return res.end(JSON.stringify({ message: "Ya existe otro anime con el mismo nombre." }));
                    }

                    const { id, ...animeData } = body;

                    contentJS[body.id] = { ...contentJS[body.id], ...animeData };

                    writeFileSync(dataAnimes, JSON.stringify(contentJS), "utf-8");

                    res.writeHead(200);
                    return res.end(JSON.stringify({ message: "Anime modificado con éxito", data: contentJS[body.id] }));
                }

                res.writeHead(404);
                return res.end(JSON.stringify({ message: "Id de anime no encontrado" }));
            });

        } else if (metodo == "DELETE") {
            res.setHeader("Content-Type", "application/json");
            const params = urlParsed.query;
            const contentString = readFileSync(dataAnimes, "utf-8");
            let contentJS = JSON.parse(contentString);

            if (contentJS[params.id]) {

                const eliminarAnime = contentJS[params.id];

                delete contentJS[params.id];

                writeFileSync(dataAnimes, JSON.stringify(contentJS), "utf-8");

                res.writeHead(200);
                return res.end(JSON.stringify({ message: "Anime eliminado con éxito", data: eliminarAnime }));
            }

            res.writeHead(404);
            return res.end(JSON.stringify({ message: "Id de anime no encontrado" }));
        }
    }
});

server.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}`);
});
