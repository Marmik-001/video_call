// (alias) useState<boolean>(initialState: boolean | (() => boolean)): [boolean, React.Dispatch<React.SetStateAction<boolean>>]

export interface asyncStateActions {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
}
// interface syncStateActions {
//   setLoading: React.Dispatch<React.SetStateAction<boolean>>;
//   setError: React.Dispatch<React.SetStateAction<Error | null>>;
// }
export const runAsync = async <T>(
  states: asyncStateActions,
  asyncFn: () => Promise<T>,
): Promise<T | null> => {
  try {
    states.setIsLoading(false);
    states.setError(null);
    return await asyncFn();
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    states.setError(new Error(errMsg));
    return null;
  } finally {
    states.setIsLoading(false);
  }
};

