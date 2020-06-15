// FICHERO DE CONFIGURACIÓN DE RUTAS DE "USUARIOS"

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas
// Cargamos el módulo "express", nos va a permitir trabajar con las rutas, protocolo HTTP, etc.
var express =  require('express');

// Cargamos el módulo "bcrypt", esto nos permite hacer un cifrado de passwords
var bcrypt = require('bcrypt');

// Importamos el Esquema de Usuario que definimos en "Modelos/Usuario.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Usuario = require('../Modelos/usuario');

// SERVICIO JWT
// Importar el módulo de JWT, las librerías JWT, para poder acceder a sus métodos
// Nos permite generar un token que será devuelto (en lugar de regresar los datos) cuando se ha logueado correctamente a un usuario
// JSON = Formato de texto Ligero de intercambio de datos basado en un subconjunto del Lenguaje de Programación JavaScript, es independiente del lenguaje que se utiliza
//      puede representar 4 tipos primitivos (cadenas, números, booleanos, valores nulos) y 2 estructurados (objetos y arreglos)
// JWT (JSON WEB TOKEN) = Conjunto de medios de seguridad para peticiones http para representar demandas para ser transferidos entre el cliente y el servidor. Es un
//       Contenedor de Información referente a la autenticación de un usuario. Las partes de un JWT se codifican como un objeto que está firmado digitalmente
//       utilizando JWS (JSON Web Signature)
var jwt = require('jsonwebtoken');

// Cargamos el middleware que creamos en el archivo "Autenticacion.js" dentro de la carpeta "Middlewares"
var mdAutenticacion = require('../Middlewares/autenticacion');



// ++++ INICIALIZACIÓN DE VARIBLES ++++
// Invocamos a la función "express", carga el framework de "express" directamente, estamos definiendo el Servidor EXPRESS
var app = express();



// =====================================
// ++++ OBTENER TODOS LOS USUARIOS ++++
// =====================================
// "app."                   = Hacemos la referencia al EXPRESS
// "get"                    = Tipo de petición que vamos a estar escuchando, en este caso es un GET
// "'/'"                    = Es el PATH, en este caso es la raíz
// "(pet, res, next ) =>"   = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//                          se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
app.get('/', ( pet , res , next ) =>
{
    // Si en el query de la petición no viene especificado desde que registro queremos el listado (porque es un parámetro opcional) entonces ponemos "0" para
    // que en ese caso nos comience a mostrar en pantalla a partir del primer registro
    var desde = pet.query.desde || 0;
    desde = Number( desde );  //Nos aseguramos de que sea un valor numérico


    // ---- Hacemos uso de Mongoose ----
    // "Usuario.find({}"    = Esta es la consulta, dentro de las llaves podemos poner el query para búsqueda, lo dejamos en blanco porque en este 
    //                      caso deseamos el listado deseamos el listado de todos los clientes
    // "'-password'"        = Indicamos que no deseamos que se muestre el Password    
    // ".skip(n)"           = El resultado de la búsqueda se muestra a partir del elemento "n"
    // "limit(n)"           = Se muestran en la página como máximo "n" elementos
    // ".exec("             = Executamos la consulta
    // "(err, usuarios)=>"  = Es el resultado de la búsqueda, es un callback que recibe 2 parámetros: un posible error(err) o la colección de usuarios(usuarios)
    Usuario.find( {} , '-password')
        .skip( desde )
        .limit( 5 )
        .exec(
            ( err , usuarios ) =>
            {
            // Ocurrió un error
            if ( err )
            {
                // ".json" = Covertimos la respuesta a un objeto JSON
                return res.status( 500 ).json({
                    ok: false,      // La petición NO se realizó
                    mensaje: 'Error al cargar los Usuarios',  // Mensaje que queremos mostrar
                    errors: err     // Descripción del error
                });
            }

            // Todo OK
            // Obtenemos el total de registros obtenidos en la consulta
            // "Medico.countDocuments" = Método de Mongoose para obtener el total de socumentos de una colección, en ese caso de la colección "usuarios"
            // "{}"             = Query, filtro del a búsqueda, en este caso queremos todos yl o dejams en blanco
            // "(err, conteo)"  = Podemos recibir un posible error(err) o bien el total de registros obtenidos(conteo)
            Usuario.countDocuments( {} , ( err , conteo ) =>
            {
                // ".json" = Covertimos la respuesta a un objeto JSON
                return res.status( 200 ).json({
                    ok: true,           // La petición se realizó correctamente
                    usuarios: usuarios, // Regresamos un arreglo con la colección de Objetos de usuarios
                    total:  conteo      // Total de registros que obtiene la consulta
                });
            })            
            
        })
});


// ===========================================
// ++++ AGREGAR UN NUEVO USUARIO A LA BDD ++++
// ===========================================
// "app."                   = Hacemos la referencia al EXPRESS
// "post"                   = Tipo de petición que vamos a estar escuchando, en este caso es un POST
// "'/'"                    = Es el PATH, en este caso es la raíz
// "(pet, res, next ) =>"   = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//                          se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.post('/', ( pet , res , next ) =>
{  
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"
    
    // Recoger los parámetros que nos llegan por la petición (por el body), que nos llegan por POST
    var params  = pet.body;
    
    // Creamos una instancia (Objeto) de Usuario
    // Le envíamos los parámetros respectivos obtenidos del POST
    var usuario = new Usuario({
        nombre:     params.nombre,
        apellido:   params.apellido,
        email:      params.email,
        
        // "bcrypt.hashSync" = Hacemos una encriptaci+on de una sola vía en el campo seleccionado
        // "10" = Es el número de rounds
        password:   bcrypt.hashSync( params.password , 10 ),

        image:      params.image,
        role:       params.role,
        activo:     params.activo
    });
    
    //Guardamos los valores del Nuevo Usuario en la BDD
    // ".save"                      = Método de mongoose
    // "( err, usuarioGuardado )=>" = Se recibe un callback, es decir, una función que regresa cuandose graba el usuario en BDD
    // "err"                        = Posible Error
    // "usuarioGuardado"            = usuarioGuardado, es todo el objeto con todos los datos del nuevo usuario que ya se guardó en BDD
    usuario.save( ( err , usuarioGuardado )=>
    {
       //En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
       if( err )
       {
            return res.status( 400 ).json({
            ok: false,
            mensaje: 'Error al Intentar Guardar al Nuevo Usuario',
            errores: err 
            });
        }

        // Todo OK
        res.status( 201 ).json({
        ok: true,                   // La petición se realizó correctamente
        usuario: usuarioGuardado,   // Regresamos el objeto del usuario que se acaba de guardar en BDD
        usuarioToken: pet.usuario   // Obtenemos la información del Usuario que hizo la petición del Servicio, esto valor se genera en la funcion
                                    // "verificaToken" del archivo "autenticacion.js"
        });
    });

});


// ===================================================
// ++++ ACTUALIZAR EN BDD LOS DATOS DE UN USUARIO ++++
// ===================================================
// "app."                   = Hacemos la referencia al EXPRESS
// "put"                    = Tipo de petición que vamos a estar escuchando, en este caso es un PUT
// "'/:id'"                 = Es el PATH, en este caso es la raíz, pero aparte indicamos que se requiere de un parámetro "ID" obligatorio
// "(pet, res, next ) =>"   = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//                          se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.put('/:id' , [ mdAutenticacion.verificaToken , mdAutenticacion.verificaROLE_ADMIN_o_MismoUsuario ] , ( pet , res , next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    //Recogemos el valor "id" del parámetro que nos llega por la URL
    var IdUsuario   = pet.params.id;

    //Recogemos los datos que tenemos en el body (los valores nuevos) para modificar el usuario
    var NuevosDatos = pet.body;

    // "Usuario"            = Hacemos uso del Esquema de usuario definido en el archivo "usuario.js" dentro de la crpeta "Modelos"
    // ".findById"          = Instrucción de Mongoose, buscamos un documento por su Id
    // "(err,usuario)=>"    = Función de callback con 2 parámetros de retorno: un posible error(err) o la respuesta, que en este caso es el objeto de un usuario(usuario) obtenido de la consulta a la BDD
    Usuario.findById( IdUsuario , ( err , usuario ) =>
    {
        // Tenemos un error
        if( err )
        {
            return res.status( 500 ).json({
                ok: false,
                mensaje: 'Error al buscar al Usuario',
                errores: err
            });
        }
        // El usuario no nos llega, el objeto está vacío
        if( !usuario )
        {
            return res.status( 400 ).json({
                ok: false,
                mensaje: 'El Usuario con el id ' + IdUsuario + ' no existe',
                errores: { message: 'No existe un Usuario con ese Id'}
            });
        }

        // Todo OK, Se localizó el registro del Usuario, estamos listos para actualizar la DATA del Usuario
        // Modificamos los datos del Usuario de acuerdo a los nuevos valores que nos llegan por el BODY
        usuario.nombre      = NuevosDatos.nombre;
        usuario.apellido    = NuevosDatos.apellido;
        usuario.email       = NuevosDatos.email;
        usuario.role        = NuevosDatos.role;
        usuario.activo      = NuevosDatos.activo;

        // Guardamos el Registro del Usuario con los nuevos valores
        // ".save"           = Método de mongoose
        // "( err, usuarioGuardado )=>" = Se recibe un callback, es decir, una función que regresa cuandose graba el usuario en BDD
        // "err"             = Posible Error
        // "usuarioGuardado" = Usuario Guardado, es todo el objeto con todos los datos del nuevo usuario que ya se guardó en BDD
        usuario.save(( err , usuarioGuardado )=>
        {
            // En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
            if( err )
            {
                return res.status( 400 ).json({
                ok: false,
                mensaje: 'Error al Intentar Actualizar los datos del Usuario',
                errores: err
                });
            }

            // Por cuestiones de seguridad no mostramos el Password
            usuarioGuardado.password = undefined;

            // Todo OK
            res.status( 200 ).json({
                ok: true,                   // La petición se realizó correctamente
                usuario: usuarioGuardado    // Regresamos el objeto del usuario que se acaba de guardar en BDD
            });
        });
    });
});


// ======================================================
// ++++ ELIMINAR DE LA BDD EL REGISTRO DE UN USUARIO ++++
// ======================================================
// "app."                   = Hacemos la referencia al EXPRESS
// "delete"                 = Tipo de petición que vamos a estar escuchando, en este caso es un DELETE
// "'/:id'"                 = Es el PATH, en este caso es la raíz, pero aparte indicamos que se requiere de un parámetro "ID" obligatorio
// "(pet, res, next ) =>"   = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//                          se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.delete('/:id' , [ mdAutenticacion.verificaToken , mdAutenticacion.verificaROLE_ADMIN ] ,  ( pet , res , next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    //Recogemos el valor "id" del parámetro que nos llega por la URL
    var IdUsuario = pet.params.id;

    // Hacemos referencia a nuestro Modelo de Usuario
    //".findByIdAndDelete"  = Buscamos un documento por su Id y lo eliminamos
    //(err,usuarioBorrado)  = Función de callback con 2 parámetros de retorno: un posible error(err) o el objeto de un Usuario(usuarioBorrado) obtenido de la consulta a la BDD
    Usuario.findByIdAndDelete( IdUsuario , ( err , usuarioBorrado )=>
    {
        // No se localiza al Usuario con el id Especificado
        if( !usuarioBorrado )
        {
            return res.status( 400 ).json({
            ok: false,   
            mensaje: 'No existe un Usuario con el ID especificado',
            errores: { message: 'No existe un Usuario con el ID especificado' }
            });
        }

        // En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
         if( err )
         {
             return res.status( 500 ).json({
             ok: false,
             mensaje: 'Error al Intentar Eliminar los datos del Usuario',
             errores: err
             });
         }

         // Todo OK
         res.status( 200 ).json({
            ok: true,                  // La petición se realizó correctamente
            usuario: usuarioBorrado    // Regresamos el objeto del usuario que se acaba de Eliminar de la BDD
         });
    });
});





// Exportamos el módulo
// Esto es para que podamos usar el "app" fuera de este archivo (las rutas)
module.exports = app;