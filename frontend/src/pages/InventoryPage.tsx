import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../api/client';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Layers,
  X
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function InventoryPage() {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    unitPrice: 0,
    minStock: 0,
    location: '',
  });

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const response = await inventoryApi.getAllParts();
      setParts(response.data);
    } catch (error) {
      console.error('Failed to load parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPart) {
        await inventoryApi.updatePart(editingPart.id, formData);
      } else {
        await inventoryApi.createPart(formData);
      }
      setShowModal(false);
      resetForm();
      loadParts();
    } catch (error) {
      console.error('Failed to save part:', error);
    }
  };

  const handleEdit = (part: any) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      sku: part.sku || '',
      description: part.description || '',
      unitPrice: Number(part.unitPrice),
      minStock: part.minStock || 0,
      location: part.location || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPart(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      unitPrice: 0,
      minStock: 0,
      location: '',
    });
  };

  const filteredParts = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-slate-900">Estoque de Peças</h1>
          <p className="text-slate-500">{parts.length} itens cadastrados no catálogo</p>
        </motion.div>
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Nova Peça
        </motion.button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={itemVariants} className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total de Itens</p>
            <p className="text-xl font-bold text-slate-900">{parts.length}</p>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Abaixo do Mínimo</p>
            <p className="text-xl font-bold text-slate-900">0</p>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Valor em Estoque</p>
            <p className="text-xl font-bold text-slate-900">R$ 0,00</p>
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-12"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Peça / SKU</th>
                  <th>Preço Unit.</th>
                  <th>Mínimo</th>
                  <th>Localização</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => (
                  <tr key={part.id}>
                    <td>
                      <div>
                        <p className="font-bold text-slate-900">{part.name}</p>
                        <p className="text-xs font-mono text-slate-400">{part.sku || 'SEM SKU'}</p>
                      </div>
                    </td>
                    <td>R$ {Number(part.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>{part.minStock}</td>
                    <td>{part.location || '-'}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(part)}
                          className="btn btn-ghost btn-sm p-2"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredParts.length === 0 && (
              <div className="empty-state">
                <Package className="empty-state-icon" />
                <h3 className="empty-state-title">Nenhuma peça encontrada</h3>
                <p className="empty-state-text">Comece cadastrando suas peças no catálogo para gerenciar o estoque.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900 uppercase">
                  {editingPart ? 'Editar' : 'Nova'} Peça
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome da Peça *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm font-bold"
                      placeholder="Ex: Pastilha de Freio Dianteira"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Código / SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                      placeholder="Código da peça"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Preço de Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Estoque Mínimo</label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Localização</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                      placeholder="Ex: Prateleira A1"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Descrição Adicional</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm min-h-[80px]"
                      placeholder="Detalhes técnicos, compatibilidade, etc."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95">
                    {editingPart ? 'Salvar Alterações' : 'Cadastrar Peça'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
