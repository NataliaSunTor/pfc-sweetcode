import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CARRITO_KEY = 'sc_carrito';

// lineas: [{ id_producto, nombre, precio, imagen, cantidad }]
function cargarCarrito() {
  try {
    return JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [lineas, setLineas] = useState(cargarCarrito);
  // Sidebar del carrito en desktop (en móvil se usa la página /carrito)
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const abrirSidebar = () => setSidebarAbierto(true);
  const cerrarSidebar = () => setSidebarAbierto(false);

  useEffect(() => {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(lineas));
  }, [lineas]);

  function addItem(producto, cantidad = 1) {
    setLineas((prev) => {
      const existe = prev.find((l) => l.id_producto === producto.id_producto);
      if (existe) {
        return prev.map((l) =>
          l.id_producto === producto.id_producto
            ? { ...l, cantidad: l.cantidad + cantidad }
            : l
        );
      }
      return [
        ...prev,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          precio: Number(producto.precio),
          imagen: producto.imagen || null,
          cantidad,
        },
      ];
    });
  }

  function quitarItem(idProducto) {
    setLineas((prev) => prev.filter((l) => l.id_producto !== idProducto));
  }

  function setCantidad(idProducto, cantidad) {
    if (cantidad <= 0) return quitarItem(idProducto);
    setLineas((prev) =>
      prev.map((l) => (l.id_producto === idProducto ? { ...l, cantidad } : l))
    );
  }

  function limpiar() {
    setLineas([]);
  }

  const { subtotal, totalItems } = useMemo(() => {
    const subtotal = lineas.reduce((acc, l) => acc + l.precio * l.cantidad, 0);
    const totalItems = lineas.reduce((acc, l) => acc + l.cantidad, 0);
    return { subtotal, totalItems };
  }, [lineas]);

  const value = {
    lineas,
    addItem,
    quitarItem,
    setCantidad,
    limpiar,
    subtotal,
    totalItems,
    sidebarAbierto,
    abrirSidebar,
    cerrarSidebar,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
