// ++++ MODELO DE "HOSPITAL" ++++
// Es una representación de una Entidad de la BDD

// Significa que puede usar las nuevas instrucciones de los nuevos estandares de JavaScript
'use strict'

// Variable para cargar el módulo de Mongoose, nos va a servir para trabajar con la BDD dentro de nuestra API REST
var mongoose = require('mongoose');

//Cargamos los esquemas de mongoose
var Esquema = mongoose.Schema;


// Definimos el esquema de nuestra colección de Hospitales, es la estructura que va a tener el objeto
// "Esquema" = Función que recibe un objeto de JavaScript con la configuración del esquema que vamso a definir
var EsquemaHospital = new Esquema({
    // "required:[true,"            = Indicamos que es un campo requerido, obligatorio
    // "'El nombre es Necesario'"   = Comentario que se mostrará cuando la condición de "required=true" no se cumpla, es decir, que en dicho campo no se tecleó nada    
    // "unique:true"                = Indicamos que el valor del campo es único, no se puede repetir    
    nombre:             {type: String, required: [true, 'El nombre es Necesario'] },
    img:                {type: String, required: false},
    usuario:            {type: Esquema.ObjectId , ref:'Usuario'},  // Campo del tipo "Usuario"
    activo:             { type: Boolean , default: true }        // Indica si el Hospital está activo o no
},
{
    versionKey:false,           // Es para quitar el "VersionKey"  (campo que aparece en los registros y que se llama "_v"), realmente no es necesario
    collection: 'hospitales'    // Est lo hacemos porque de lo contrario en MongoDB se crearía la colección con el nombre de "hospitals"
});

//-- Exportamos el Módulo --
//"mongoose.model":     Se genera el modelo
//"'Hospital'":         Nombre de la entidad, va a representar a un documento de la entidad de "Hospitales"
//                      Cuando el objeto se guarde en BDD lo que va a pasar es que al nombre de la entidad ("Hospital") lo pondrá en minusculas y lo pluralizará, es decir, va a generar
//                      la colección "hospitales" y guardará un documento con el esquema definido aquí
//"EsquemaHospital":    Esquema que va a tener cada objeto que se crea con este modelo
module.exports = mongoose.model('Hospital',EsquemaHospital);
