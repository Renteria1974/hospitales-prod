// ++++ MODELO DE "MEDICO" ++++
// Es una representación de una Entidad de la BDD

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// Variable para cargar el módulo de Mongoose, nos va a servir para trabajar con la BDD dentro de nuestra API REST
var mongoose = require('mongoose');

//Cargamos los esquemas de mongoose
var Esquema = mongoose.Schema;


// Definimos el esquema de nuestra colección de Medicos, es la estructura que va a tener el objeto
// "Esquema" = Función que recibe un objeto de JavaScript con la configuración del esquema que vamos a definir
var EsquemaMedico = new Esquema({
    // "required:[true,"            = Indicamos que es un campo requerido, obligatorio
    // "'El nombre es Necesario'"   = Comentario que se mostrará cuando la condición de "required=true" no se cumpla, es decir, que en dicho campo no se tecleó nada    
    // "unique:true"                = Indicamos que el valor del campo es único, no se puede repetir    
    nombre:             { type: String , required: [true , 'El nombre es Necesario'] },
    img:                { type: String , required: false },
    usuario:            { type: Esquema.ObjectId , ref:'Usuario' , required: true },    // Campo del tipo "Usuario"
    hospital:           { type: Esquema.ObjectId , ref:'Hospital' , required: [ true, 'El id del Hospital es un campo Obligatorio'] },   // Campo del tipo "Hospital"
    activo:             { type: Boolean , default: true }                               // Indica si el Usuario está activo o no
},
{
    versionKey:false    // Es para quitar el "VersionKey"  (campo que aparece en los registros y que se llama "_v"), realmente no es necesario    
});

//-- Exportamos el Módulo --
//"mongoose.model": Se genera el modelo
//"'Medico'":       Nombre de la entidad, va a representar a un documento de la entidad de "Medicos"
//                      Cuando el objeto se guarde en BDD lo que va a pasar es que al nombre de la entidad ("Medico") lo pondrá en minusculas y lo pluralizará, es decir, va a generar
//                      la colección "medicos" y guardará un documento con el esquema definido aquí
//"EsquemaMedico":  Esquema que va a tener cada objeto que se crea con este modelo
module.exports = mongoose.model('Medico' , EsquemaMedico );
