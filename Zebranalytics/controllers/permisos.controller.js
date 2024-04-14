const DataPermisos = require('../models/permisos.model');


exports.get_permisos = (request, response, next) =>{
    DataPermisos.fetchRoles()
    .then(([roles, fieldData]) => {
        totalRoles = roles;
        return DataPermisos.fetchAll()
    })
    .then(([rows, fieldData]) => { //Cargamos los permisos
        // Renderiza la view
        response.render('permisos', {
        // asigna a dataPermisos el valor de las rows
        dataPermisos: rows,
        csrfToken: request.csrfToken(),
        permisos: request.session.permisos || [],
        })
    })
    .catch(error => {
        console.log(error);
    });

}

exports.post_permisos = (request, response, next) =>{
    request.session.username = request.body.username;
}

exports.post_asignar_permiso = (request, response, next) =>{
    request.session.username = request.body.username;
    DataPermisos.asigna(request.body.rol, request.body.idpermiso)

    .then(([rows, fieldData]) => {
        response.redirect('/permisos');
    })
    .catch((error) => {
        console.log(error)
        request.session.error = 'Error al asignar permiso';
        response.redirect('/permisos');
    })
}

exports.post_desasignar_permiso = (request, response, next) =>{
    request.session.username = request.body.username;
    DataPermisos.desasigna(request.body.deleteRol, request.body.deleteIdPermiso)

    .then(([rows, fieldData]) => {
        response.redirect('/permisos');
    })
    .catch((error) => {
        console.log(error)
        request.session.error = 'Error al desasignar permiso';
        response.redirect('/permisos');
    })
}

exports.getNewRol = (request, response, next) =>{
    DataPermisos.fetchPermisos().then(([rows, fieldData]) => { //Cargamos los permisos
        
        // Renderiza la view
        response.render('newRol', {
        // asigna a dataPermisos el valor de las rows
        totalPermisos: rows,
        csrfToken: request.csrfToken(),
        permisos: request.session.permisos || [],
        })
    })
    .catch(error => {
        console.log(error);
    });
}


exports.postNewRol = (request, response, next) =>{
    DataPermisos.newRol(request.body.rolName, request.body.permisos)
    .then(([rows, fieldData]) => {
        response.redirect('/permisos');
    })
    .catch((error) => {
        console.log(error)
        request.session.error = 'Error al crear rol';
        response.redirect('/permisos');
    })
}

exports.postDeleteRol = (request, response, next) =>{
    DataPermisos.deleteRol(request.body.IDRol)
    .then(() => {
        response.redirect('/permisos');
    })
    .catch((error) => {
        console.log(error)
        request.session.error = 'Error al borrar rol';
        response.redirect('/permisos');
    })
}