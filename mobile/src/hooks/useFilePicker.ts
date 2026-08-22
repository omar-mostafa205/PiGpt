import * as DocumentPicker from "expo-document-picker";
import { solveApi } from "../services/api/solve";

export const useFilePicker = () => {
  const pickPdf = async (): Promise<string | null> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;
    const asset = result.assets[0];

    const form = new FormData();
    form.append("file", {
      uri: asset.uri,
      name: asset.name,
      type: "application/pdf",
    } as any);

    try {
      const { extractedText } = await solveApi.uploadPdf(form);
      return extractedText;
    } catch {
      return null;
    }
  };

  return { pickPdf };
};
