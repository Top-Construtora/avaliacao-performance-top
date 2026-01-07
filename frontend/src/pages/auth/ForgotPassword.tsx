import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import logo from '../../../assets/images/logo.png';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Erro ao enviar email de recuperação:', err);
      setError(
        err.message ||
        'Erro ao enviar email de recuperação. Verifique se o email está correto.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1e2938] to-[#0f151c] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100"
              >
                <CheckCircle className="h-10 w-10 text-green-600" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900">
                Email Enviado!
              </h2>
              <p className="text-gray-600">
                Enviamos um link de recuperação de senha para <strong>{email}</strong>
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700 mb-2">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <p className="text-xs text-gray-500">
                  O email pode levar alguns minutos para chegar. Não se esqueça de verificar a pasta de spam.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-6 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md hover:opacity-90 active:scale-[0.98]"
                style={{backgroundColor: '#1e2938'}}
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar para Login
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e2938] to-[#0f151c] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
          {/* Logo e Título */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl shadow-lg"
              style={{backgroundColor: '#1e2938'}}
            >
              <img src={logo} alt="Logo" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900">
              Esqueceu sua senha?
            </h1>
            <p className="text-gray-600">
              Digite seu email e enviaremos um link para redefinir sua senha
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mensagem de Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Campo de Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white`}
                  placeholder="seu@email.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'hover:opacity-90 active:scale-[0.98]'
              }`}
              style={!loading ? {backgroundColor: '#1e2938'} : {}}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  <span>Enviar Link de Recuperação</span>
                </>
              )}
            </button>

            {/* Botão Voltar */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 px-6 rounded-lg font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar para Login</span>
            </button>
          </form>

          {/* Link de Login */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Lembrou sua senha?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-medium hover:underline transition-colors"
                style={{color: '#1e2938'}}
              >
                Fazer login
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
