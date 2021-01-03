import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('@GoMarketplace:products');

      if (storagedProducts) setProducts([...JSON.parse(storagedProducts)]);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async (product: Product) => {
    setProducts(prevProducts => {
      const existingProduct = prevProducts.find(prod => prod.id === product.id);

      if (existingProduct) return prevProducts.map(prod => {
        return prod.id === existingProduct.id
          ? { ...existingProduct, quantity: existingProduct.quantity + 1 }
          : prod;
      });

      return [...prevProducts, { ...product, quantity: 1 }];
    });

    await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
  }, []);

  const increment = useCallback(async (id: string) => {
    setProducts(prevProducts => prevProducts.map(product => {
      return product.id === id
        ? { ...product, quantity: product.quantity + 1 }
        : product;
    }));

    await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
  }, []);

  const decrement = useCallback(
    async (id: string) => {
      const handledProduct = products.find(product => product.id === id);

      if (handledProduct && handledProduct.quantity === 1) {
        setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
      } else {
        setProducts(prevProducts => prevProducts.map(product => {
          return product.id === id
            ? { ...product, quantity: product.quantity - 1 }
            : product;
        }));
      }

      await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
    },
    [products],
  );

  const value = useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
    }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
