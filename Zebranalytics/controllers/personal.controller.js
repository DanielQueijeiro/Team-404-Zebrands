const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');

exports.get_personal = (request, response, next) =>{
    Usuario.fetchAll().then(([rows, fieldData]) => { //Cargamos todos nuestros empleados en personal
        for(aux in rows){
            var fecha = new Date(rows[aux].fechaAsignacion);
            // Formatear la fecha para mostrar solo la parte de la fecha
            var opcionesDeFormato = { year: 'numeric', month: '2-digit', day: '2-digit' };
            var fechaFormateada = fecha.toLocaleDateString('es-ES', opcionesDeFormato);
            rows[aux].fechaAsignacion = fechaFormateada;
        }
        response.render('personal', {
        personal: rows,
        csrfToken: request.csrfToken(),
        permisos: request.session.permisos || [],
        })
    })
    .catch(error => {
        console.log(error);
    });
}

exports.post_personal = (request, response, next) =>{
    //Creamos objeto usuario con los datos del request para agregar un empleado
    const usuario = new Usuario(request.body.nombre, request.body.correo, request.body.password, request.body.rol);
    usuario.save() //Llamamos el método save del modelo para guardar los datos
        .then(([rows, fieldData]) => {
            response.redirect('/personal');
        })
        .catch((error) => {
            console.log(error)
            request.session.error = 'Nombre de usuario invalido';
            response.redirect('/personal');
        })
}

exports.post_delete_personal = (request, response, next) =>{
    Usuario.delete(request.body.correo) //Llamamos el método save del modelo para guardar los datos
        .then(([rows, fieldData]) => {
            response.redirect('/personal');
        })
        .catch((error) => {
            console.log(error)
            request.session.error = 'Error al borrar';
            response.redirect('/personal');
        })
}