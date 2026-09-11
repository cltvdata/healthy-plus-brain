import { GoogleGenAI } from "@google/genai";
import { GroundingMetadata } from "../types";

// Ensure API key is present; in a real app, handle this more gracefully in UI
let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI | null => {
  if (aiClient) return aiClient;
  
  // Safe environment variable check in Vite / SPA context
  const key = (typeof process !== 'undefined' && process.env ? process.env.API_KEY : '') || '';
  if (key) {
    aiClient = new GoogleGenAI({ apiKey: key });
    return aiClient;
  }
  return null;
};

export const generateHealthResponse = async (
  prompt: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  try {
    const ai = getAiClient();
    if (!ai) {
      // Return a simulated high-fidelity response when no key is configured,
      // so the app never crashes and provides an excellent user experience.
      const simulatedText = `Para sincronizar tus aplicaciones como **MyFitnessPal**, **Google Fit**, o **Health Connect**, sigue estos pasos recomendados:
      
1. **Sincronizar MyFitnessPal con Health Connect**:
   - Abre MyFitnessPal y ve a **Más** > **Aplicaciones y Dispositivos**.
   - Selecciona **Health Connect** y activa todos los permisos de lectura y escritura.
   
2. **Sincronizar Google Fit**:
   - Abre Google Fit, ve a **Perfil** > **Ajustes**.
   - Selecciona **Sincronizar Fit con Health Connect** para transferir automáticamente pasos y calorías.

3. **Verificar Estado en Healthy + Brain**:
   - Ve a la pestaña **Lobby** de tu app y presiona **Sincronizar Wearables**. Tus datos biométricos se actualizarán en tiempo real.

*(Nota: Esta es una respuesta generada de forma local porque el servidor aún no tiene configurado un API Key de Gemini).*`;

      return { 
        text: simulatedText,
        groundingMetadata: {
          searchEntryPoint: {
            renderedContent: "MyFitnessPal Health Connect synchronization steps"
          },
          groundingChunks: [
            { web: { title: "MyFitnessPal Support", uri: "https://support.myfitnesspal.com" } },
            { web: { title: "Google Fit Support", uri: "https://support.google.com/fit" } }
          ]
        }
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful technical support assistant specialized in health and fitness apps (like MyFitnessPal, Google Fit, Health Connect, Samsung Health). Provide clear, step-by-step instructions. If the user asks in Spanish, answer in Spanish. Use Markdown to format your response nicely (lists, bold text).",
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Lo siento, no pude generar una respuesta.";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;

    return { text, groundingMetadata };
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return graceful fallback rather than throwing uncaught crash
    return {
      text: `Ocurrió un error al procesar tu consulta con la IA. No te preocupes, puedes verificar tu conexión a internet o reintentar. Aquí tienes una sugerencia rápida: asegúrate de activar todos los permisos en la configuración de la App de Google Play Console.`,
      groundingMetadata: {}
    };
  }
};