const Preguntas = require('../models/preguntas.model')
const bcrypt = require('bcryptjs');

// Controlador genérico para obtener la vista de marca
exports.getMarca = async (request, response, next) => {
    const marca = request.params.marca.toUpperCase();
    const error = request.session.error;
    request.session.error = '';

    try {
        // Obtener todas las categorías para una marca específica
        const [categorias] = await Preguntas.fetchCategoriasPorMarca(marca);

        // Convertir los resultados en un array de nombres de categorías
        const nombresCategorias = categorias.map(categoria => categoria.categoria_nombre);

        // Renderizar vista pasando la marca y sus categorías
        response.render('marca_categorias', {
            marca: marca,
            categorias: nombresCategorias,
            permisos: request.session.permisos || [],
            csrfToken: request.csrfToken(),
            error: error
        });
    } catch (error) {
        console.log(error);
        response.status(500).send('Error interno del servidor');
    }
};

// Controlador genérico para obtener la vista de una encuesta de una categoría específica
exports.getNuevaEncuesta = async (request, response, next) => {
    const { marca, categoria } = request.params;
    const error = request.session.error;
    request.session.error = '';

    try {
        const [preguntas] = await Preguntas.fetchByMarcaAndCategoria(marca, categoria);

        for (let pregunta of preguntas) {
            const [opciones] = await Preguntas.fetchOpcionesPorPregunta(pregunta.IDPreguntas);
            pregunta.opciones = opciones.map((opcion) => ({
                IDOpcion: opcion.IDopcion, 
                TextoOpcion: opcion.TextoOpcion
            }));
        }
        

        const ultimoId = preguntas.length > 0 ? preguntas[preguntas.length - 1].IDPreguntas : 0;

        response.render('encuesta_categoria', {
            preguntas: preguntas,
            ultimoId: ultimoId,
            csrfToken: request.csrfToken(),
            permisos: request.session.permisos || [],
            marca: marca,
            categoria: categoria,
            error: error
        });
    } catch (error) {
        console.log(error);
        response.status(500).send('Error interno del servidor al intentar obtener las preguntas');
    }
};

// Controlador para agregar preguntas a encuestas
exports.postNuevaEncuesta = async (request, response, next) => {
    const { marca, categoria } = request.params;
    const { EstadoObligatorio, TipoPregunta, Pregunta, Opciones } = request.body;
    const correo = request.session.correo;

    try {
        const pregunta = new Preguntas(marca, EstadoObligatorio, TipoPregunta, Pregunta, categoria);

        
        const [rows, fieldData] = await pregunta.save(correo);

        if (Opciones && (TipoPregunta === 'Checkbox' || TipoPregunta === 'OpcionMultiple')) {
            const idPregunta = rows.insertId; 
            const opcionesArray = Opciones.split('&').map(opcion => opcion.trim());
            await Preguntas.saveOptions(idPregunta, opcionesArray);
        }

        response.redirect(`/encuestas/${marca}/${categoria}`);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error interno del servidor');
    }
};


// Controlador para eliminar Encuesta
exports.postDeleteEncuesta = async (request, response, next) => {
    const marca = request.params.marca; 
    const categoria = request.params.categoria; 

    try {
    // Eliminar todas las preguntas asociadas a la marca y categoría
    await Preguntas.deleteByMarcaAndCategoria(marca, categoria);

    // Redireccionar después de eliminar la encuesta
    response.redirect(`/encuestas/${marca}/${categoria}`); 

    } catch (error) {
        console.log(error);
        response.status(500).send('Error interno del servidor');
        }
};


// Controlador para Editar pregunta de la encuesta
exports.postEditarPregunta = async (request, response, next) => {
    const marca = request.params.marca;
    const categoria = request.params.categoria;
    const correo = request.session.correo;

    try {
        const idPregunta = request.body.idpreguntacambiar;
        const tipoPregunta = request.body.tipo_pregunta;
        const opciones = request.body.Opciones;

        const preguntaExistente = await Preguntas.obtenerPreguntaPorId(idPregunta);
        if (!preguntaExistente) {
            return response.redirect(`/encuestas/${marca}/${categoria}`);
        }

        await Preguntas.editPregunta(
            idPregunta,
            request.body.pregunta,
            request.body.obligatorio,
            tipoPregunta,
            correo
        );

        // Si el tipo de pregunta ha cambiado a "Checkbox" o "Opción Múltiple", actualizar opciones
        if (opciones && (tipoPregunta === 'Checkbox' || tipoPregunta === 'OpcionMultiple')) {
            // Eliminar opciones existentes antes de guardar las nuevas
            await Preguntas.deleteOptions(idPregunta);
            const opcionesArray = opciones.split('&').map(opcion => opcion.trim());
            await Preguntas.saveOptions(idPregunta, opcionesArray);
        }

        response.redirect(`/encuestas/${marca}/${categoria}`);
    } catch (error) {
        console.log(error);
        if (!response.headersSent) {
            response.status(500).send('Error interno del servidor');
        }
    }
};

// Controlador para eliminar 1 pregunta
exports.postDeletePregunta = async (request, response, next) => {
    const marca = request.params.marca;
    const categoria = request.params.categoria;
    const idPregunta = request.params.id || request.body.id; 
    const correo = request.session.correo;

    try {
        await Preguntas.deleteById(idPregunta, correo); 
        response.redirect(`/encuestas/${marca}/${categoria}`);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error interno del servidor');
    }
};

// Controlador para editar opciones de una pregunta
exports.postEditarOpcionesPregunta = async (request, response, next) => {
    const marca = request.params.marca;
    const categoria = request.params.categoria;
    const idOpcion = request.body.IDopcion; 
    const textoOpcion = request.body.TextoOpcion;

    // Verifica si alguno es indefinido
    if (typeof idOpcion === 'undefined' || typeof textoOpcion === 'undefined') {
        console.log('idOpcion o TextoOpcion no definidos');
        return response.status(400).send('Los datos necesarios no están completos.');
    }

    // Verifica si el texto de la opción contiene el carácter '&'
    if (textoOpcion.includes('&')) {
        request.session.error = 'La opción no se puede registrar con &';
        return response.redirect(`/encuestas/${marca}/${categoria}`);
    }

    try {
        await Preguntas.editPreguntaOpciones(idOpcion, textoOpcion);
        return response.redirect(`/encuestas/${marca}/${categoria}`);
    } catch (error) {
        console.log(error);
        return response.status(500).send('Error interno del servidor al intentar editar la opción');
    }
};



// Controlador para previsualizar encuesta
exports.getPrevisualizarEncuesta = async (request, response, next) => {
    const { marca, categoria } = request.params;

    try {
        const preguntas = await Preguntas.fetchEncuestasPorMarcaYCategoria(marca, categoria);

        for (let pregunta of preguntas) {
            const [opciones] = await Preguntas.fetchOpcionesPorPregunta(pregunta.IDPreguntas);
            pregunta.opciones = opciones.map(opcion => ({
                id: opcion.IDopcion,
                texto: opcion.TextoOpcion
            }));
        }

        response.render('previsualizar_encuesta', {
            preguntas,
            marca,
            categoria,
            permisos: request.session.permisos || [],
            csrfToken: request.csrfToken()
        });
    } catch (error) {
        console.log(error);
        response.status(500).send('Error interno del servidor');
    }
};

// Controlador para modificar tiempo de encuesta
exports.postModificarTiempo = async (request, response, next) => {
    const marca = request.params.marca;
    const categoria = request.params.categoria;
    const tiempo = request.body.dias;

    try {
        await Preguntas.updateTiempo(marca, categoria, tiempo);
        response.redirect(`/encuestas/${marca}/${categoria}`);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error interno del servidor');
    }
}