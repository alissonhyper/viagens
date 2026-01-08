import React from 'react';


const TrayScreen: React.FC = () => {
  return (
    <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Bandeja</h2>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        Aqui entra sua Bandeja real. (Tela criada para integrar com o menu.)
      </p>
    </div>
  );
};

export default TrayScreen;
