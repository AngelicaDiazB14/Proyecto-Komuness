import { Request, Response } from "express";
import { modelSeccionAcerca } from "../models/seccionAcerca.model";
import fs from 'fs';
import path from 'path';

/**
 * Obtener la sección acerca de (solo activa)
 */
export const getSeccionAcerca = async (req: Request, res: Response): Promise<void> => {
  try {
    let seccion = await modelSeccionAcerca.findOne({ estado: true });
    
    if (!seccion) {
      // Crear una sección por defecto con toda la información
      const seccionDefault = new modelSeccionAcerca({
        titulo: "COOPESINERGIA R.L. - Tejiendo Futuro en Comunidad",
        contenido: "Coopesinergia R.L. es una cooperativa autogestionaria de carácter cultural y comunitario que ejecuta proyectos para el desarrollo humano. Actualmente estamos trabajando en Tejarcillos de Alajuelita, un territorio marcado por la migración, la pobreza y el abandono institucional, pero con una enorme riqueza humana, creativa y solidaria. Desde este contexto, el proyecto Komuness surge como una respuesta colectiva, diseñada y impulsada en conjunto con los líderes juveniles y las familias, para crear espacios dignos, seguros y significativos para la niñez, adolescencia y juventudes, donde el arte, la educación y la cooperación sean motores de transformación social.",
        historia: "Nuestra historia...",
        mision: "Nuestra misión...",
        vision: "Nuestra visión...",
        queHacemos: "Nuestro trabajo parte del convencimiento de que el arte no es un lujo, sino una herramienta vital para la reconstrucción del tejido social, la afirmación de la identidad y la generación de bienestar integral. En Tejarcillos, la cultura es raíz, refugio y resistencia.",
        motivacion: "Nace de la certeza de que la ternura y la acción colectiva pueden transformar la exclusión en memoria de superación y la precariedad en esperanza y oportunidades.",
        impacto: "Cada clase, mural o comida compartida es un acto de dignidad. Estos espacios ya están dando frutos tangibles...",
        uneteCausa: "Te invitamos a ser parte de esta transformación colectiva. Tu apoyo puede tomar muchas formas...",
        informacionDonaciones: {
          cuentaBancaria: "0005964154",
          iban: "CR86016111084159641540",
          nombreCuenta: "Coopesinergia",
          cedulaJuridica: "3-002-639930",
          emailFinanzas: "coopesinergiafinanzas@gmail.com",
          donacionesEspecie: [
            "Alimentos en buen estado para el comedor",
            "Materiales para nuestros procesos creativos",
            "Ropa nueva o usada en buen estado"
          ]
        },
        contactos: {
          telefono: "85690514",
          email: "komunesscr@gmail.com",
          facebook: "https://www.facebook.com/komuness",
          instagram: "https://www.instagram.com/komunesscr/"
        },
        equipo: [],
        imagenesProyectos: [],
        imagenesEquipo: []
      });
      
      const saved = await seccionDefault.save();
      res.json(saved);
      return;
    }

    // Si el documento existe pero le faltan campos nuevos, actualizarlos con valores por defecto
    if (!seccion.queHacemos) {
      seccion.queHacemos = "Nuestro trabajo parte del convencimiento de que el arte no es un lujo, sino una herramienta vital para la reconstrucción del tejido social, la afirmación de la identidad y la generación de bienestar integral. En Tejarcillos, la cultura es raíz, refugio y resistencia.";
    }
    if (!seccion.motivacion) {
      seccion.motivacion = "Nace de la certeza de que la ternura y la acción colectiva pueden transformar la exclusión en memoria de superación y la precariedad en esperanza y oportunidades.";
    }
    if (!seccion.impacto) {
      seccion.impacto = "Cada clase, mural o comida compartida es un acto de dignidad. Estos espacios ya están dando frutos tangibles...";
    }
    if (!seccion.uneteCausa) {
      seccion.uneteCausa = "Te invitamos a ser parte de esta transformación colectiva. Tu apoyo puede tomar muchas formas...";
    }
    if (!seccion.informacionDonaciones) {
      seccion.informacionDonaciones = {
        cuentaBancaria: "0005964154",
        iban: "CR86016111084159641540",
        nombreCuenta: "Coopesinergia",
        cedulaJuridica: "3-002-639930",
        emailFinanzas: "coopesinergiafinanzas@gmail.com",
        donacionesEspecie: [
          "Alimentos en buen estado para el comedor",
          "Materiales para nuestros procesos creativos",
          "Ropa nueva o usada en buen estado"
        ]
      };
    }

    // Guardar los cambios si se actualizaron campos
    await seccion.save();

    res.json(seccion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la sección acerca de" });
  }
};

/**
 * Crear o actualizar sección acerca de
 */
export const createOrUpdateSeccionAcerca = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    
    const { 
      titulo, 
      contenido, 
      historia, 
      mision, 
      vision, 
      queHacemos,
      motivacion,
      impacto,
      uneteCausa,
      informacionDonaciones,
      contactos, 
      equipo 
    } = req.body;

    // Validar que los datos existen
    if (!titulo && !contenido) {
      res.status(400).json({ message: "Datos incompletos" });
      return;
    }

    let seccion = await modelSeccionAcerca.findOne({ estado: true });

    if (seccion) {
      // Actualizar con valores por defecto si son undefined
      const updateData = {
        titulo: titulo !== undefined ? titulo : seccion.titulo,
        contenido: contenido !== undefined ? contenido : seccion.contenido,
        historia: historia !== undefined ? historia : seccion.historia,
        mision: mision !== undefined ? mision : seccion.mision,
        vision: vision !== undefined ? vision : seccion.vision,
        queHacemos: queHacemos !== undefined ? queHacemos : seccion.queHacemos,
        motivacion: motivacion !== undefined ? motivacion : seccion.motivacion,
        impacto: impacto !== undefined ? impacto : seccion.impacto,
        uneteCausa: uneteCausa !== undefined ? uneteCausa : seccion.uneteCausa,
        informacionDonaciones: informacionDonaciones !== undefined ? informacionDonaciones : seccion.informacionDonaciones,
        contactos: contactos !== undefined ? contactos : seccion.contactos,
        equipo: equipo !== undefined ? equipo : seccion.equipo
      };

      console.log('Actualizando con:', updateData);

      // Usar findOneAndUpdate para mejor control
      const updated = await modelSeccionAcerca.findOneAndUpdate(
        { estado: true },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updated) {
        res.status(404).json({ message: "No se encontró la sección para actualizar" });
        return;
      }

      res.json(updated);
    } else {
      // Crear nueva con valores por defecto para campos requeridos
      const nuevaSeccion = new modelSeccionAcerca({
        titulo: titulo || "Título por defecto",
        contenido: contenido || "Contenido por defecto",
        historia: historia || "Historia por defecto",
        mision: mision || "Misión por defecto",
        vision: vision || "Visión por defecto",
        queHacemos: queHacemos || "Qué hacemos por defecto",
        motivacion: motivacion || "Motivación por defecto",
        impacto: impacto || "Impacto por defecto",
        uneteCausa: uneteCausa || "Únete a nuestra causa por defecto",
        informacionDonaciones: informacionDonaciones || {
          cuentaBancaria: "0005964154",
          iban: "CR86016111084159641540",
          nombreCuenta: "Coopesinergia",
          cedulaJuridica: "3-002-639930",
          emailFinanzas: "coopesinergiafinanzas@gmail.com",
          donacionesEspecie: []
        },
        contactos: contactos || {
          telefono: "85690514",
          email: "komunesscr@gmail.com",
          facebook: "",
          instagram: ""
        },
        equipo: equipo || [],
        imagenesProyectos: [],
        imagenesEquipo: []
      });

      const saved = await nuevaSeccion.save();
      console.log('Nueva sección creada:', saved);
      res.status(201).json(saved);
    }
  } catch (error: unknown) {
    console.error('Error detallado al guardar:', error);
    
    // Manejar el error de forma type-safe
    let errorMessage = "Error al guardar la sección acerca de";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    res.status(500).json({ 
      message: "Error al guardar la sección acerca de",
      error: errorMessage 
    });
  }
};

// Los métodos uploadImagen y deleteImagen se mantienen igual...
/**
 * Subir imagen para proyectos o equipo
 */
export const uploadImagen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tipo } = req.body; // 'proyectos' o 'equipo'
    
    if (!req.file) {
      res.status(400).json({ message: "No se subió ningún archivo" });
      return;
    }

    if (!['proyectos', 'equipo'].includes(tipo)) {
      // Eliminar archivo subido
      fs.unlinkSync(req.file.path);
      res.status(400).json({ message: "Tipo debe ser 'proyectos' o 'equipo'" });
      return;
    }

    const seccion = await modelSeccionAcerca.findOne({ estado: true });
    if (!seccion) {
      res.status(404).json({ message: "No se encontró la sección acerca de" });
      return;
    }

    const imagenPath = `/uploads/${req.file.filename}`;
    
    if (tipo === 'proyectos') {
      if (seccion.imagenesProyectos.length >= 10) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ message: "Máximo 10 imágenes para proyectos" });
        return;
      }
      seccion.imagenesProyectos.push(imagenPath);
    } else {
      if (seccion.imagenesEquipo.length >= 10) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ message: "Máximo 10 imágenes para equipo" });
        return;
      }
      seccion.imagenesEquipo.push(imagenPath);
    }

    await seccion.save();
    res.json({ message: "Imagen subida exitosamente", path: imagenPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al subir imagen" });
  }
};

/**
 * Eliminar imagen
 */
export const deleteImagen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tipo, imagenPath } = req.body;
    const seccion = await modelSeccionAcerca.findOne({ estado: true });

    if (!seccion) {
      res.status(404).json({ message: "No se encontró la sección acerca de" });
      return;
    }

    // Eliminar archivo físico
    const fullPath = path.join(__dirname, '..', '..', 'public', imagenPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Eliminar de la base de datos
    if (tipo === 'proyectos') {
      seccion.imagenesProyectos = seccion.imagenesProyectos.filter(img => img !== imagenPath);
    } else {
      seccion.imagenesEquipo = seccion.imagenesEquipo.filter(img => img !== imagenPath);
    }

    await seccion.save();
    res.json({ message: "Imagen eliminada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar imagen" });
  }
};