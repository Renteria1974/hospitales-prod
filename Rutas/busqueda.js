// FICHERO DE CONFIGURACIÓN DE LA RUTA PARA LA BÚSQUEDA GENERAL

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas
// Cargamos el módulo "express", nos va a permitir trabajar con las rutas, protocolo HTTP, etc.
var express = require('express');

// Importamos el Esquema de Hospital que definimos en "Modelos/hospital.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Hospital = require('../Modelos/hospital');

// Importamos el Esquema de Medico que definimos en "Modelos/medico.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Medico = require('../Modelos/medico');

// Importamos el Esquema de Usuario que definimos en "Modelos/usuario.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Usuario = require('../Modelos/usuario');


// ++++ INICIALIZACIÓN DE VARIBLES ++++
// Invocamos a la función "express", carga el framework de "express" directamente, estamos definiendo el Servidor EXPRESS
var app = express();


// ======================================================
// ********** BÚSQUEDA POR COLECCIÓN **********
// ======================================================
app.get('/coleccion/:tabla/:busqueda', ( pet , res ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    // Extraemos del query el valor del parámetro "busqueda"
    var busqueda = pet.params.busqueda;

    // Extraemos del query el valor de la Tabla o colección en donde vamos a realizar la búsqueda
    var tabla = pet.params.tabla;

    // Promesa que se desea ejecutar
    var promesa;

    // Generamos una variable de tipo "Expresion Regular" para que podamos hacer la búsqueda de manera correcta
    // es decir, por ejemplo tecleamos "clinic" y nos muestre: Clinica del Norte, clinica regional, etc....
    // "i'" = Para que la búsqueda sea insensible a minusculas y mayúsculas
    var expreg = new RegExp( busqueda , 'i');


    // Implementamos un "switch" para seleccionar la colección sobre la que se hará la consulta
    switch( tabla )
    {
        // Colección "usuarios"
        case 'usuarios':
            promesa = buscarUsuarios( expreg );
            break;

        // Colección "medicos"
        case 'medicos':
            promesa = buscarMedicos( expreg );
            break;

        // Colección "hospitales"
        case 'hospitales':
            promesa = buscarHospitales( expreg );
            break;

        // En caso de que la colección que se manda llamar no exista
        default:
            // return" = Para que aquói se corte la ejecución del método
            // ".json" = Connvertimos la respuesta a un objeto JSON
            return  res.status(400).json({
                ok: false,      // La petición NO se realizó
                mensaje: 'Los tipos de búsqueda sólo son: usuarios, medicos, hospitales',  // Mensaje que queremos mostrar
                error: { message: 'Tipo de Tabla/Colección no válido' }
            })
    }    

    // Se ejecuta la "promesa" en caso de que se haya ejecutado alguna de las consultas
    // "data" = Se recibe el valor de la "data", que en este momento no se sabe a cual colección corresponde (usuarios, medicos, hospitales)
    promesa.then( data =>
    {
        // "[tabla]" = En ECMAScrip6 a esto se le llama "propiedad computada" que significa que va a poner el valor del campo,
        //             en este caso es el nombre de la colección con la que se está trabajando
        res.status( 200 ).json({
            ok: true,       // La petición se realizó satisfactoriamente            
            [ tabla ]:data    // Se regresa el arreglo con los objetos de la colección           
        });
    });

});



// ======================================================
// ********** BÚSQUEDA GENERAL **********
// ======================================================
// "app."                   = Hacemos la referencia al EXPRESS
// "get"                    = Tipo de petición que vamos a estar escuchando, en este caso es un GET
// "'/todo/:busqueda'"      = Es el PATH, en este caso lleva losa parámetros "todo" y "búsqueda"
// "(pet, res, next ) =>"   = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
app.get('/todo/:busqueda' , (pet, res, next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"
    
    // Extraemos del query el valor del parámetro "busqueda"
    var busqueda = pet.params.busqueda;

    // Generamos una variable de tipo "Expresion Regular" para que podamos hacer la búsqueda de manera correcta
    // es decir, por ejemplo tecleamos "clinic" y nos muestre: Clinica del Norte, clinica regional, etc....
    // "i'" = Para que la búsqueda sea insensible a minusculas y mayúsculas
    var expreg = new RegExp( busqueda , 'i');


    // "Promise.all" = Nos permite mandar un arreglo de Promesas, ejecutarlas y si todas responden correctamente podemos
    //                  disparar un "then", y si una falla se tiene que manejar el "catch"
    Promise.all( [
        buscarHospitales( expreg ),
        buscarMedicos( expreg ),
        buscarUsuarios( expreg ) ] )
        // No se recibe un valor único de las promesas, recibe un arrego con las respuestas
        .then( respuestas =>
        {
            // Indicamos que la operación se realizó correctamente
            // ".json" = Covertimos la respuesta a un objeto JSON
            res.status(200).json({
                ok: true,                   // La petición se realizó correctamente
                hospitales: respuestas[ 0 ],  // Retornamos la colección de "hospitales", es la posición "0" porque es la primer promesa que se ejecuta
                medicos: respuestas[ 1 ],     // Retornamos la colección de "medicos", es la posición "1" porque es la segunda promesa que se ejecuta
                usuarios: respuestas[ 2 ]     // Retornamos la colección de "usuarios", es la posición "2" porque es la tercera promesa que se ejecuta
            });

        })
        // Ocurrió un error
        .catch( err =>
        {
            // ".json" = Covertimos la respuesta a un objeto JSON
            res.status( 500 ).json({
                ok: false,      // La petición NO se realizó
                mensaje: 'Error al Realizar la Búsqueda General',  // Mensaje que queremos mostrar
                errors: err     // Descripción del error
            })
        });
});


// Método para realizar la busqueda de HOSPITALES
function buscarHospitales( expreg )
{
    // Creamos una promesa e inmediatamente la retornamos inmediatamente
    // "(respuesta, rechazado )" = Callback, que recibe 2 parámetros
    return new Promise( ( respuesta , rechazado ) =>
    {
        // Hacemos la búsqueda en la colección de "hospitales"
        // "Hospital.find"                  =  Usamos Mongoose con su método "find" para hacer una búsqueda
        // "{ nombre: busqueda }"           =  Es el query, el filtro, en este caso se buscan los hospitales en base a su campo "nombre" 
                                            // el cual debe coincidir con el valor del parámetro "busqueda"
        //.populate('usuario' '-password)   = En lugar de solo el ID arrastra toda la información del Usuario a exceptión del "password"
        // ".exec((err, hospitales)"        = Se ejecuta el query, puede regresar un error(err) o una colección de Hospitales(hospitales)
        //                                  se obtiene toda la información de dicho usuario a excepción del password
        Hospital.find({ nombre: expreg })
            .populate( 'usuario', '-password' )
            .exec(( err , hospitales)=>
            {
                // Ocurrió un error
                if( err )
                {
                rechazado('Error al cargar Hospitales', err);
                }
                // Todo OK
                else
                {
                    respuesta( hospitales );   // Retornamos la DATA de los Hospitales, es decir, los documentos
                }
            });
    });
}


// Método para realizar la busqueda de MEDICOS
function buscarMedicos( expreg )
{
    // Creamos una promesa e inmediatamente la retornamos inmediatamente
    // "(resuelto, rechazar )" = Callback, que recibe 2 parámetros
    return new Promise( ( respuesta , rechazado ) =>
    {
        // Hacemos la búsqueda en la colección de "medicos"
        // "Medico.find"                    =  Usamos Mongoose con su método "find" para hacer una búsqueda
        // "{ nombre: busqueda }"           =  Es el query, el filtro, en este caso se buscan los hospitales en base a su campo "nombre" el cual debe coincidir con el valor del parámetro "busqueda"
        //.populate('usuario' '-password)   = En lugar de solo el ID arrastra toda la información del Usuario a exceptión del "password"
        // ".exec((err, medicos)"           = Se ejecuta el query, puede regresar un error(err) o una colección de Medicos(medicos)
        //                                  se obtiene toda la información de dicho usuario a excepción del password
        Medico.find({ nombre: expreg })
            .populate( 'usuario' , '-password' )
            .exec(( err , medicos)=>
            {
                // Ocurrió un error
                if( err )
                {
                    rechazado('Error al cargar Medicos', err);
                }
                // Todo OK
                else
                {
                    respuesta( medicos );   // Retornamos la DATA de los Medicos, es decir, los documentos
                }
            });
    });
}


// Método para realizar la busqueda de USUARIOS
// A diferencia de los métodos de búsqueda de los Hospitales y los Médicos aquí vamos a buscar en 2 columnas del Usuario
function buscarUsuarios( expreg )
{
    // Creamos una promesa e inmediatamente la retornamos inmediatamente
    // "(resuelto, rechazar )" = Callback, que recibe 2 parámetros
    return new Promise( ( respuesta , rechazado ) =>
    {
        // Hacemos la búsqueda en la colección de "usuarios"
        // "Usuario.find"               = Usamos Mongoose con su método "find" para hacer una búsqueda
        // "{}, '-password'"            = ("{}" significa que no tenemos condición de búsqueda) Con esto indicamos que no queremos regresar el campo "password" del usuario
        // ".or()"                      = Función del Mongoose, recibe un arreglo de condiciones (en este caso la búsqueda se hara en los campos "nombre" y "email")
        // "'nombre': expreg }, { 'email': expreg }" =  Es el query, el filtro, en este caso se buscan los usuarios en base a sus campos "nombre" e "email" el cual debe coincidir con el valor del parámetro "busqueda"
        // ".exec( (err, usuarios )"    = Ejecutamos el query, el cual puede retornar un error(err) o la colección de usuarios(usuarios)
        Usuario.find({} , '-password')
            .or( [ { 'nombre': expreg } , { 'email': expreg }  ] )
            .exec( ( err , usuarios ) =>
            {
                // Ocurrió un error
                if( err )
                {
                    rechazado('Error al cargar Usuarios' , err);
                }
                // Todo OK
                else
                {
                    respuesta( usuarios );   // Retornamos la DATA de los Usuarios, es decir, los documentos
                }
            });
    });
}


// Exportamos el módulo
// Esto es para que lo podamos usar fuera de este archivo el "app" (las rutas)
module.exports = app;