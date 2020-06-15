// FICHERO DE CONFIGURACIÓN DE RUTAS DE "MEDICOS"

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas
// Cargamos el módulo "express", nos va a permitir trabajar con las rutas, protocolo HTTP, etc.
var express =  require('express');

// Importamos el Esquema de Medico que definimos en "Modelos/medico.js" para poder usar todas las fuciones y métodos que tiene dicho Modelo
var Medico = require('../Modelos/medico');

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
// ++++ OBTENER TODOS LOS MEDICOS ++++
// =====================================
// "app."   = Hacemos la referencia al EXPRESS
// "get"    = Tipo de petición que vamos a estar escuchando, en este caso es un GET
// "'/'"    = Es el PATH, en este caso es la raíz
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
app.get('/', ( pet , res , next ) =>
{
    
     // Si en el query de la petición no viene especificado desde que registro queremos el listado (porque es un parámetro opcional) entonces ponemos "0" para
    // que en ese caso nos comience a mostrar en pantalla a partir del primer registro
    var desde = pet.query.desde || 0;
    desde = Number( desde );  //Nos aseguramos de que sea un valor numérico


    // ---- Hacemos uso de Mongoose ----
    // "Medico.find({}"     = Esta es la consulta, dentro de las llaves podemos poner el query para búsqueda, lo dejamos en blanco porque en este
    //                          caso deseamos el listado deseamos el listado de todos los medicos
    // "(err, medicos)=>"   = Es el resultado de la búsqueda, es un callback que recibe 2 parámetros: un posible error(err) o la colección de medicos(medicos)    
    // ".populate('usuario', nombre email)"   = Para que devuelva el ID, nombre y email del Usuario que hizo el LOGUIN en lugar de solo su ID
    // ".exec("             = Executamos la consulta
    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .exec(
            ( err , medicos )=>
            {
            // Ocurrió un error
            if ( err )
            {
                // ".json" = Covertimos la respuesta a un objeto JSON
                return res.status( 500 ).json({
                    ok: false,      // La petición NO se realizó
                    mensaje: 'Error al cargar los Médicos',  // Mensaje que queremos mostrar
                    errors: err     // Descripción del error
                });
            }

            // Todo OK
            // Obtenemos el total de registros obtenidos en la consulta
            // "Medico.countDocuments" = Método de Mongoose para obtener el total de socumentos de una colección, en ese caso de la colección "medicos"
            // "{}"             = Query, filtro del a búsqueda, en este caso queremos todos y lo dejams en blanco
            // "(err, conteo)"  = Podemos recibir un posible error(err) o bien el total de registros obtenidos(conteo)
            Medico.countDocuments({} , ( err , conteo )=>
            {
                // ".json" = Covertimos la respuesta a un objeto JSON
                return res.status( 200 ).json({
                    ok: true,           // La petición se realizó correctamente
                    medicos: medicos,   // Regresamos un arreglo con la colección de Objetos de medicos
                    total: conteo       // Total de registros obtenidos en la consulta
                });
            }) 
        })
});



// ===========================================
// ++++ AGREGAR UN NUEVO MEDICO A LA BDD ++++
// ===========================================
// "app."   = Hacemos la referencia al EXPRESS
// "post"   = Tipo de petición que vamos a estar escuchando, en este caso es un POST
// "'/'"    = Es el PATH, en este caso es la raíz
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.post('/', mdAutenticacion.verificaToken,  ( pet , res , next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    // Recoger los parámetros que nos llegan por la petición (por el body), que nos llegan por POST
    var params  = pet.body;

    // Creamos una instancia (Objeto) de Usuario
    // Le envíamos los parámetros respectivos obtenidos del POST
    var medico = new Medico({
        nombre:     params.nombre,
        image:      params.image,
        usuario:    pet.usuario._id,
        hospital:   params.hospital,
        activo:     params.activo
    });
    
    //Guardamos los valores del Nuevo Medico en la BDD
    // ".save"                      = Método de mongoose
    // "( err, medicoGuardado )=>"  = Se recibe un callback, es decir, una función que regresa cuandose graba el medico en BDD
    // "err"                        = Posible Error
    // "medicoGuardado"             = hospitalGuardado, es todo el objeto con todos los datos del nuevo medico que ya se guardó en BDD
    medico.save( ( err , medicoGuardado ) =>
    {
       //En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
       if(err)
       {
            return res.status( 400 ).json({
                ok: false,
                mensaje: 'Error al Intentar Guardar al Nuevo Médico',
                errores: err
            });
        }

        // Todo OK
        res.status( 201 ).json({
            ok: true,               // La petición se realizó correctamente
            medico: medicoGuardado  // Regresamos el objeto del medico que se acaba de guardar en BDD            
        });
    });
});



// ===================================================
// ++++ ACTUALIZAR EN BDD LOS DATOS DE UN MÉDICO ++++
// ===================================================
// "app."   = Hacemos la referencia al EXPRESS
// "put"    = Tipo de petición que vamos a estar escuchando, en este caso es un PUT
// "'/:id'" = Es el PATH, en este caso es la raíz, pero aparte indicamos que se requiere de un parámetro "ID" obligatorio
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.put('/:id',mdAutenticacion.verificaToken,  ( pet , res , next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    //Recogemos el valor "id" del parámetro que nos llega por la URL
    var IdMedico   = pet.params.id;

    //Recogemos los datos que tenemos en el body (los valores nuevos) para modificar el usuario
    var NuevosDatos = pet.body;

    // "Medico"         = Hacemos uso del Esquema de medico definido en el archivo "medico.js" dentro de la carpeta "Modelos"
    // ".findById"      = Instrucción de Mongoose, buscamos un documento por su Id
    // "(err,medico)=>" = Función de callback con 2 parámetros de retorno: un posible error(err) o la respuesta, que en este caso es el objeto de un hospital(hospital) obtenido de la consulta a la BDD
    Medico.findById( IdMedico , ( err , medico ) =>
    {
        // Tenemos un error
        if( err )
        {
            return res.status( 500 ).json({
                ok: false,
                mensaje: 'Error al buscar al Médico',
                errores: err
            });
        }
        // El medico no nos llega, el objeto está vacío
        if( !medico )
        {
            return res.status( 400 ).json({
                ok: false,
                mensaje: 'El Medico con el id ' + IdMedico + ' no existe',
                errores: { message: 'No existe un Médico con ese Id'}
            });
        }

        // Todo OK, Se localizó el registro del Médico, estamos listos para actualizar la DATA del Médico
        // Modificamos los datos del Médico de acuerdo a los nuevos valores que nos llegan por el BODY
        medico.nombre   = NuevosDatos.nombre;
        medico.usuario  = pet.usuario._id;
        medico.hospital = NuevosDatos.hospital;
        medico.activo   = NuevosDatos.activo;


        // Guardamos el Registro del Médico con los nuevos valores
        // ".save"                      = Método de mongoose
        // "( err, medicoGuardado )=>"  = Se recibe un callback, es decir, una función que regresa cuandose graba el medico en BDD
        // "err"                        = Posible Error
        // "medicoGuardado"             = Médico Guardado, es todo el objeto con todos los datos del nuevo medico que ya se guardó en BDD
        medico.save(( err, medicoGuardado )=>
        {
            // En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
            if(err)
            {
                return res.status( 400 ).json({
                    ok: false,
                    mensaje: 'Error al Intentar Actualizar los datos del Médico',
                    errores: err
                });
            }
            
            // Todo OK
            res.status( 200 ).json({
                ok: true,               // La petición se realizó correctamente
                medico: medicoGuardado  // Regresamos el objeto del medico que se acaba de guardar en BDD
            });
        });
    });
});



// ======================================================
// ++++ ELIMINAR DE LA BDD EL REGISTRO DE UN MEDICO ++++
// ======================================================
// "app."   = Hacemos la referencia al EXPRESS
// "delete" = Tipo de petición que vamos a estar escuchando, en este caso es un DELETE
// "'/:id'" = Es el PATH, en este caso es la raíz, pero aparte indicamos que se requiere de un parámetro "ID" obligatorio
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.delete('/:id',mdAutenticacion.verificaToken,  ( pet, res, next ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    //Recogemos el valor "id" del parámetro que nos llega por la URL
    var IdMedico = pet.params.id;

    // Hacemos referencia a nuestro Modelo de Usuario
    //".findByIdAndDelete"  = Buscamos un documento por su Id y lo eliminamos
    //(err,medicoBorrado)   = Función de callback con 2 parámetros de retorno: un posible error(err) o el objeto de un Medico(medicoBorrado) obtenido de la consulta a la BDD
    Medico.findByIdAndDelete( IdMedico , ( err , medicoBorrado )=>
    {
        // No se localiza al Medico con el id Especificado
        if( !medicoBorrado )
        {
            return res.status( 400 ).json({
                ok: false,   
                mensaje: 'No existe un Médico con el ID especificado',
                errores: { message: 'No existe un Médico con el ID especificado' }
            });
        }

        // En caso de ocurrir un error salimos del proceso con "return" y enviamos el mensaje
         if( err )
         {
             return res.status( 500 ).json({
                ok: false,
                mensaje: 'Error al Intentar Eliminar los datos del Médico',
                errores: err
             });
         }

         // Todo OK
         res.status( 200 ).json({
            ok: true,              // La petición se realizó correctamente
            medico: medicoBorrado  // Regresamos el objeto del medico que se acaba de Eliminar de la BDD
         });
    });
});



// ======================================================
// ++++ OBTENER LOS DATOS DE UN MÉDICO ++++
// ======================================================
// "app."   = Hacemos la referencia al EXPRESS
// "get"    = Tipo de petición que vamos a estar escuchando, en este caso es un GET
// "'/:id'" = Es el PATH, en este caso es la raíz, pero aparte indicamos que se requiere de un parámetro "ID" obligatorio
// "(pet, res ) =>" = Es una funcion de callback que recibe 2 parámetros: petición(pet) y respuesta(res)
// Aquí recibimos la información que se envía mediante un HTTP POST o un POST
app.get('/:id', ( pet , res ) =>
{
    //Si nos llegan datos por POST o GET utilizamos "body"
    //Si nos llegan los datos por la URL utilizamos "params"

    //Recogemos el valor "id" del parámetro que nos llega por la URL
    var id = pet.params.id;
    
    // Hacemos referencia a nuestro Modelo de Hospital
    //".findById"                             = Buscamos un documento por su Id
    // ".populate('usuario', nombre email)"   = Para que devuelva el nombre img y email del Usuario que creó el registro del Médico
    // ".populate('hospital')"                = Para que devuelva todos los campos del Hospital al que pertenece el Médico
    // ".exec("                               = Executamos la consulta, el query
    // "( err , medico )"                     = La ejecución del método "finfById" nos regresa un posible error(err) o bien un objeto "Medico"
    Medico.findById( id )
        .populate('usuario' , 'nombre img email')
        .populate('hospital')
        .exec( ( err , medico ) =>
        {
            // Se produce un error
            if ( err )
            {
                return res.status( 500 ).json({
                    ok: false,
                    mensaje: 'Error al buscar al Médico',
                    errors: err
                });
            }
            // Se reguresa un Objeto "medico" vacío
            if ( !medico )
            {
                return res.status( 400 ).json({
                    ok: false,
                    mensaje: 'El Médico con el id ' + id + 'no existe',
                    errors: { message: 'No existe un Médico con ese ID' }
                });
            }
            res.status( 200 ).json({
                ok: true,
                medico: medico
            });
        })
});




// Exportamos el módulo
// Esto es para que podamos usar el "app" fuera de este archivo (las rutas)
module.exports = app;