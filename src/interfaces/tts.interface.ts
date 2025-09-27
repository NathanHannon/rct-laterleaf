export interface TTSVoice {
    voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
    description: string;
    recommended: string;
}

export interface TTSControlsProps {
    articleId: string;
    variant?: 'card' | 'minimal';
}