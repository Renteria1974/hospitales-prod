// FICHERO DE CONFIGURACIÓN DE LA RUTA PRINCIPAL DE LA APLICACIÓN

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// ++++ REQUIRES ++++
// Es una importación de librerías ya sea de terceros o personalizadas que ocupamos para que funcione algo ++++
// Recordar que todo lo que teclamos es KEY SENSITIVE, es decir, se diferencian minúsculas de mayúsculas

// Cargamos el módulo "express", nos va a permitir trabajar con las rutas, protocolo HTTP, etc.
var express =  require('express');


// ++++ INICIALIZACIÓN DE VARIBLES ++++
// Invocamos a la función "express", carga el framework de "express" directamente, estamos definiendo el Servidor EXPRESS
var app = express();



// "app."   = Hacemos la referencia al EXPRESS
// "get"    = Tipo de petición que vamos a estar escuchando, en este caso es un GET
// "'/'"    = Es el PATH, en este caso es la raíz
// "(pet, res, next ) =>" = Es una funcion de callback que recibe 3 parámetros: petición(pet), respuesta(res) y next(le dice a EXPRESS que cuando
//            se ejecute esta función cotinue con la sig. instrucción, aunque por lo regular este parámetro se usa en los MIDDLEWARE)
app.get('/', (pet, res, next ) =>
{
    // Indicamos que la operación se realizó correctamente
    // ".json" = Covertimos la respuesta a un objeto JSON
    res.status(200).json({
        ok: true,   // La petición se realizó correctamente
        mensaje: 'Petición realizada Correctamente'  // Mensaje que queremos mostrar
    });
});


// Exportamos el módulo
// Esto es para que lo podamos usar fuera de este archivo el "app" (las rutas)
module.exports = app;