import { useSubjectStore } from "../store/subjectStore";
import { getSubjectConfig } from "../constants/subjects";

export const useSubject = () => {
  const { activeSubject, activeLabel, setSubject, setSubjectByLabel } = useSubjectStore();
  const config = getSubjectConfig(activeSubject);
  return { activeSubject, activeLabel, setSubject, setSubjectByLabel, config };
};
