import torch
import torch.nn as nn
import torchvision.transforms as T

class AEEncoder(nn.Module):
    def __init__(self, residual_scale=0.3):
        super().__init__()
        self.residual_scale = residual_scale
        self.msg_fc = nn.Linear(32, 16384)
        self.net = nn.Sequential(
            nn.Conv2d(4, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 3, kernel_size=3, padding=1)
        )

    def forward(self, img, msg):
        batch_size = img.size(0)
        msg_feat = self.msg_fc(msg).view(batch_size, 1, 128, 128)
        x = torch.cat([img, msg_feat], dim=1)
        residual = self.net(x)
        return img + self.residual_scale * residual

class AEDecoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True)
        )
        self.fc = nn.Sequential(
            nn.Linear(8192, 256),
            nn.ReLU(inplace=True),
            nn.Linear(256, 32)
        )

    def forward(self, x):
        features = self.net(x)
        features = features.view(features.size(0), -1)
        return self.fc(features)

class GANEncoder(AEEncoder):
    """Adversarial Generator for invisible watermark embedding."""
    pass

class GANDecoder(AEDecoder):
    """Adversarial Extractor for 32-bit watermark recovery."""
    pass

class VAEEncoder(nn.Module):
    def __init__(self, latent_channels=64, residual_scale=0.3):
        super().__init__()
        self.residual_scale = residual_scale
        self.msg_fc = nn.Linear(32, 16384)
        self.trunk = nn.Sequential(
            nn.Conv2d(4, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True)
        )
        self.mu_head = nn.Conv2d(64, latent_channels, kernel_size=3, padding=1)
        self.logvar_head = nn.Conv2d(64, latent_channels, kernel_size=3, padding=1)
        self.decode_trunk = nn.Sequential(
            nn.Conv2d(latent_channels, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 3, kernel_size=3, padding=1)
        )

    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std

    def forward(self, img, msg):
        batch_size = img.size(0)
        msg_feat = self.msg_fc(msg).view(batch_size, 1, 128, 128)
        x = torch.cat([img, msg_feat], dim=1)
        feat = self.trunk(x)
        mu = self.mu_head(feat)
        logvar = self.logvar_head(feat)
        z = self.reparameterize(mu, logvar)
        decoded = self.decode_trunk(z)
        return img + self.residual_scale * decoded

class VAEDecoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True)
        )
        self.fc = nn.Sequential(
            nn.Linear(8192, 256),
            nn.ReLU(inplace=True),
            nn.Linear(256, 32)
        )

    def forward(self, x):
        features = self.net(x)
        features = features.view(features.size(0), -1)
        return self.fc(features)

class PatchEmbeddings(nn.Module):
    def __init__(self, in_channels=3, dim=768, patch_size=16):
        super().__init__()
        self.projection = nn.Conv2d(in_channels, dim, kernel_size=patch_size, stride=patch_size)

    def forward(self, x):
        return self.projection(x)

class Embeddings(nn.Module):
    def __init__(self, dim=768):
        super().__init__()
        self.cls_token = nn.Parameter(torch.zeros(1, 1, dim))
        self.position_embeddings = nn.Parameter(torch.zeros(1, 197, dim))
        self.patch_embeddings = PatchEmbeddings(3, dim)

    def forward(self, x):
        x = self.patch_embeddings(x)
        x = x.flatten(2).transpose(1, 2)
        cls_tokens = self.cls_token.expand(x.size(0), -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        x = x + self.position_embeddings
        return x

class Attention(nn.Module):
    def __init__(self, dim=768, num_heads=12):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = dim // num_heads
        self.scale = self.head_dim ** -0.5
        self.q_proj = nn.Linear(dim, dim)
        self.k_proj = nn.Linear(dim, dim)
        self.v_proj = nn.Linear(dim, dim)
        self.o_proj = nn.Linear(dim, dim)

    def forward(self, x):
        B, N, C = x.shape
        q = self.q_proj(x).reshape(B, N, self.num_heads, self.head_dim).permute(0, 2, 1, 3)
        k = self.k_proj(x).reshape(B, N, self.num_heads, self.head_dim).permute(0, 2, 1, 3)
        v = self.v_proj(x).reshape(B, N, self.num_heads, self.head_dim).permute(0, 2, 1, 3)
        attn = (q @ k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)
        x = (attn @ v).permute(0, 2, 1, 3).reshape(B, N, C)
        x = self.o_proj(x)
        return x

class MLP(nn.Module):
    def __init__(self, dim=768, hidden_dim=3072):
        super().__init__()
        self.fc1 = nn.Linear(dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, dim)
        self.act = nn.GELU()

    def forward(self, x):
        return self.fc2(self.act(self.fc1(x)))

class TransformerLayer(nn.Module):
    def __init__(self, dim=768, hidden_dim=3072):
        super().__init__()
        self.attention = Attention(dim)
        self.layernorm_before = nn.LayerNorm(dim)
        self.layernorm_after = nn.LayerNorm(dim)
        self.mlp = MLP(dim, hidden_dim)

    def forward(self, x):
        x = x + self.attention(self.layernorm_before(x))
        x = x + self.mlp(self.layernorm_after(x))
        return x

class Pooler(nn.Module):
    def __init__(self, dim=768):
        super().__init__()
        self.dense = nn.Linear(dim, dim)

    def forward(self, x):
        return torch.tanh(self.dense(x))

class ViTBackbone(nn.Module):
    def __init__(self, dim=768, hidden_dim=3072):
        super().__init__()
        self.embeddings = Embeddings(dim)
        self.layers = nn.ModuleList([TransformerLayer(dim, hidden_dim) for _ in range(12)])
        self.layernorm = nn.LayerNorm(dim)
        self.pooler = Pooler(dim)

    def forward(self, x):
        x = self.embeddings(x)
        for layer in self.layers:
            x = layer(x)
        x = self.layernorm(x)
        return x

class WatermarkDetector(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = ViTBackbone()
        self.classifier = nn.Sequential(
            nn.Linear(768, 128),
            nn.ReLU(),
            nn.Linear(128, 2)
        )

    def forward(self, x):
        backbone_out = self.backbone(x)
        cls_token = backbone_out[:, 0]
        logits = self.classifier(cls_token)
        return logits

def prepare_for_vit(image):
    transform = T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
    ])
    return transform(image).unsqueeze(0)


# ============================================================================
# Latent-Residual (Diffusion / TAESD) Watermarking Components
# ============================================================================

class TAESDBlock(nn.Module):
    def __init__(self, c_in, c_out):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(c_in, c_out, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(c_out, c_out, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(c_out, c_out, 3, padding=1),
        )
        self.skip = nn.Conv2d(c_in, c_out, 1, bias=False) if c_in != c_out else nn.Identity()

    def forward(self, x):
        return self.skip(x) + self.conv(x)


class TAESDEncoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1),
            TAESDBlock(64, 64),
            nn.Conv2d(64, 64, 3, stride=2, padding=1, bias=False),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            nn.Conv2d(64, 64, 3, stride=2, padding=1, bias=False),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            nn.Conv2d(64, 64, 3, stride=2, padding=1, bias=False),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            nn.Conv2d(64, 4, 3, padding=1),
        )

    def forward(self, x):
        return self.layers(x)


class TAESDDecoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Conv2d(4, 64, 3, padding=1),
            nn.ReLU(inplace=True),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            nn.Upsample(scale_factor=2),
            nn.Conv2d(64, 64, 3, padding=1, bias=False),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            nn.Upsample(scale_factor=2),
            nn.Conv2d(64, 64, 3, padding=1, bias=False),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            TAESDBlock(64, 64),
            nn.Upsample(scale_factor=2),
            nn.Conv2d(64, 64, 3, padding=1, bias=False),
            TAESDBlock(64, 64),
            nn.Conv2d(64, 3, 3, padding=1),
        )

    def forward(self, x):
        return self.layers(x)


class AutoencoderTinyWrapper(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = TAESDEncoder()
        self.decoder = TAESDDecoder()

    def encode(self, x):
        class Output:
            pass
        out = Output()
        out.latents = self.encoder(x)
        return out

    def decode(self, z):
        class Output:
            pass
        out = Output()
        out.sample = self.decoder(z)
        return out


class LatentResidualEncoder(nn.Module):
    """
    Latent-Residual Watermarking Generator.
    Embeds 32-bit watermark inside TAESD latent space, maps delta into pixel residual.
    """
    def __init__(self, message_len=32, img_size=128, latent_scale=2.0, residual_scale=0.1):
        super().__init__()
        self.message_len = message_len
        self.img_size = img_size
        self.latent_scale = latent_scale
        self.residual_scale = residual_scale
        self.vae = AutoencoderTinyWrapper()
        self.latent_size = img_size // 8
        self.msg_fc = nn.Linear(message_len, self.latent_size * self.latent_size)
        self.msg_proj = nn.Linear(message_len, 4 * self.latent_size * self.latent_size)
        self.latent_net = nn.Sequential(
            nn.Conv2d(4 + 1, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 4, 3, padding=1),
        )

    def forward(self, image, message):
        batch = image.size(0)
        image32 = image.float()
        message32 = message.float()
        with torch.no_grad():
            latents = self.vae.encode(image32 * 2 - 1).latents
            base = self.vae.decode(latents).sample
        message_map = self.msg_fc(message32).view(batch, 1, self.latent_size, self.latent_size)
        direct = self.msg_proj(message32).view(batch, 4, self.latent_size, self.latent_size)
        features = self.latent_net(torch.cat([latents, message_map], dim=1))
        delta = self.latent_scale * torch.tanh(features + direct)
        marked = self.vae.decode(latents + delta).sample
        cap = self.residual_scale
        residual = (marked - base) / 2
        return torch.clamp(image32 + cap * torch.tanh(residual / cap), 0.0, 1.0)


