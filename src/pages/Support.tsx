import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Heart, Brain, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SupportProps {
  onNavigate: (page: string) => void;
}

const Support = ({ onNavigate }: SupportProps) => {
  const supportContent = [
    {
      category: "Tristeza",
      icon: "💙",
      color: "border-l-primary",
      bgColor: "bg-primary/5",
      articles: [
        {
          title: "5 formas de acalmar uma criança triste",
          description: "Estratégias gentis para apoiar seu filho em momentos difíceis",
          readTime: "3 min",
          ageGroup: "4-12 anos"
        },
        {
          title: "Como falar sobre sentimentos com crianças",
          description: "Dicas para criar um ambiente seguro para conversas emocionais",
          readTime: "5 min",
          ageGroup: "4-12 anos"
        }
      ]
    },
    {
      category: "Ansiedade",
      icon: "🌸",
      color: "border-l-accent",
      bgColor: "bg-accent/10",
      articles: [
        {
          title: "Respiração divertida para crianças ansiosas",
          description: "Técnicas de respiração lúdicas que realmente funcionam",
          readTime: "4 min",
          ageGroup: "4-8 anos"
        },
        {
          title: "Rotinas que acalmam a ansiedade infantil",
          description: "Como criar estruturas que dão segurança emocional",
          readTime: "6 min",
          ageGroup: "4-12 anos"
        }
      ]
    },
    {
      category: "Problemas Escolares",
      icon: "🏫",
      color: "border-l-secondary",
      bgColor: "bg-secondary/20",
      articles: [
        {
          title: "Como falar sobre bullying",
          description: "Abordagens para identificar e lidar com situações de bullying",
          readTime: "7 min",
          ageGroup: "6-12 anos"
        },
        {
          title: "Dificuldades de adaptação escolar",
          description: "Ajudando seu filho a se adaptar a mudanças na escola",
          readTime: "5 min",
          ageGroup: "4-10 anos"
        }
      ]
    }
  ];

  const emergencyTips = [
    {
      title: "Criança muito agitada",
      tip: "Respire junto com ela, conte até 10 devagar e ofereça um abraço"
    },
    {
      title: "Choro intenso",
      tip: "Valide os sentimentos: 'Vejo que você está muito triste, estou aqui com você'"
    },
    {
      title: "Recusa para conversar",
      tip: "Respeite o momento e diga: 'Quando quiser conversar, estarei aqui'"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center bg-card shadow-card">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-8 space-y-6">
        {/* Título */}
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">🤗 Apoio Emocional</h1>
          <p className="text-muted-foreground">
            Dicas e recursos para apoiar o bem-estar da criança
          </p>
        </div>

        {/* Dicas de emergência */}
        <Card className="shadow-card border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Heart className="w-5 h-5" />
              SOS - Dicas Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyTips.map((tip, index) => (
                <div key={index} className="p-3 bg-destructive/5 rounded-lg border-l-4 border-l-destructive">
                  <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tip.tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo por categoria */}
        {supportContent.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.articles.map((article, articleIndex) => (
                  <div 
                    key={articleIndex}
                    className={`p-4 rounded-xl border-l-4 ${category.color} ${category.bgColor} hover:shadow-md transition-shadow cursor-pointer`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{article.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {article.description}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            📖 {article.readTime}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            👶 {article.ageGroup}
                          </Badge>
                        </div>
                      </div>
                      <BookOpen className="w-5 h-5 text-muted-foreground ml-4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Recursos adicionais */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recursos Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary-soft/30 rounded-lg">
                <h4 className="font-medium mb-2">📚 Livros Recomendados</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "O Monstro das Cores" - Anna Llenas</li>
                  <li>• "Tenho Monstros na Barriga" - Tonia Casarin</li>
                  <li>• "O Livro dos Sentimentos" - Todd Parr</li>
                </ul>
              </div>
              
              <div className="p-4 bg-secondary/30 rounded-lg">
                <h4 className="font-medium mb-2">🎯 Atividades Práticas</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Desenhar os sentimentos</li>
                  <li>• Diário emocional com figuras</li>
                  <li>• Yoga para crianças</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quando buscar ajuda profissional */}
        <Card className="shadow-card border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Brain className="w-5 h-5" />
              Quando Buscar Ajuda Profissional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm mb-3">
                Considere procurar um psicólogo infantil se observar:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Tristeza persistente por mais de 2 semanas</li>
                <li>• Mudanças drásticas no comportamento</li>
                <li>• Dificuldades significativas na escola ou em casa</li>
                <li>• Medos excessivos que interferem no dia a dia</li>
                <li>• Perda de interesse em atividades que antes gostava</li>
              </ul>
              <div className="mt-4 p-3 bg-card rounded-lg">
                <p className="text-sm">
                  <strong>💡 Lembre-se:</strong> Buscar ajuda profissional é um ato de amor e cuidado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;