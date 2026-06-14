/** Renders help copy with **bold** segments for on-screen UI labels. */
export function HelpText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}
