# Rebuilds the Sprout rig in this folder from ../sprout-base.png: the body
# with the chest the arms covered painted in, both leaf arms, one leg, a
# sitting composite and rig.json. Needs numpy and Pillow.  python3 build-rig.py
import numpy as np, json, sys, os
from PIL import Image, ImageDraw, ImageFilter
OUT=sys.argv[1] if len(sys.argv)>1 else os.path.dirname(os.path.abspath(__file__)); os.makedirs(OUT,exist_ok=True)
B=np.asarray(Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','sprout-base.png')).convert('RGB')).astype(np.float32)/255
bg=np.array([6,35,24])/255
d=np.sqrt(((B-bg)**2).sum(-1))*255
a=np.clip((d-30)/40,0,1)
F=np.where(a[...,None]>0.02,(B-(1-a[...,None])*bg)/np.maximum(a[...,None],0.02),0)
RGBA=np.dstack([np.clip(F,0,1),a])
x0,y0,x1,y1=0,42,937,1254          # the same framing as site/img/sprout-corner.webp
A=RGBA[y0:y1,x0:x1].copy(); H,W=A.shape[:2]
k=W/557.0                           # traced in the 557x720 web cut-out's units
X=np.arange(W)[None,:].repeat(H,0); Y=np.arange(H)[:,None].repeat(W,1)

def catmull(pts,n=10):
    P=pts+pts[:3]; out=[]
    for i in range(len(pts)):
        p0,p1,p2,p3=[np.array(P[i+j],float) for j in range(4)]
        for s in np.linspace(0,1,n,endpoint=False):
            out.append(tuple(0.5*((2*p1)+(-p0+p2)*s+(2*p0-5*p1+4*p2-p3)*s*s+(-p0+3*p1-3*p2+p3)*s**3)))
    return out
def mask(poly):
    S=3; m=Image.new('L',(W*S,H*S),0)
    ImageDraw.Draw(m).polygon([(x*k*S,y*k*S) for x,y in catmull(poly)],fill=255)
    return np.asarray(m.resize((W,H),Image.LANCZOS)).astype(np.float32)/255
left=[(50,519),(65,507),(90,502),(120,501),(160,505),(200,512),(240,530),(270,552),(290,578),(305,604),(316,632),(322.5,652),
      (323,700),(323,740),(125,740),(120,710),(105,690),(90,670),(75,650),(65,635),(55,615),(50,600),(45,580),(42,560),(44,535)]
right=[(323,740),(323,652),(332,630),(350,600),(375,575),(400,552),(425,540),(450,530),(480,520),(507,512),(530,511),(545,514),(560,525),
       (570,560),(565,620),(540,690),(520,740)]
torso=[(50,519),(42,560),(32,600),(14,648),(0,690),(-20,760),(480,760),(470,720),(488,668),(506,610),(518,555),(536,480),(520,430),(60,430),(48,480)]
mL=mask(left); mR=mask(right); seamX=323*k
seam=Y>650*k
mL=np.where(seam&(X>=seamX),0,mL); mR=np.where(seam&(X<seamX),0,mR)
mAny=np.clip(mL+mR,0,1)
grow=lambda m,n: np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(n))).astype(np.float32)/255
hole=grow((mAny>0.02).astype(np.float32),3)>0.5
T=mask(torso)
yy=(Y/k-480)/240
jade=np.stack([0.200-0.050*yy,0.700-0.110*yy,0.525-0.090*yy],-1)
dd=np.sqrt(((X/k-300)/215.0)**2+((Y/k-545)/170.0)**2)
belly=np.clip((1-dd)/0.55,0,1); belly=belly*belly*(3-2*belly)
mint=np.stack([0.776-0.12*yy,0.937-0.07*yy,0.812-0.10*yy],-1)
paint=jade*(1-belly[...,None])+mint*belly[...,None]
body=A.copy()
body[...,:3]=np.where(hole[...,None],paint,A[...,:3]); body[...,3]=np.where(hole,T,A[...,3])
def arm(m):
    o=A.copy(); o[...,3]=A[...,3]*grow(m,5); return o
def img(arr): return Image.fromarray((np.clip(arr,0,1)*255).astype(np.uint8),'RGBA')
bodyI=img(body); armL=img(arm(mL)); armR=img(arm(mR))
boxL=armL.getbbox(); boxR=armR.getbbox()
bodyI.save(f'{OUT}/body.png',optimize=True)
armL.crop(boxL).save(f'{OUT}/arm-left.png',optimize=True)
armR.crop(boxR).save(f'{OUT}/arm-right.png',optimize=True)

# One leg, drawn in the arms' own jade, hanging straight down from its hip.
h=H; lw=0.085*h; ln=0.19*h; fw=0.066*h; fh=0.034*h
LW=int(lw+2*fw+8); LH=int(lw/2+ln+fh+lw*0.1+8); S=4
leg=Image.new('RGBA',(LW*S,LH*S),(0,0,0,0)); g=np.zeros((LH*S,LW*S,4),np.float32)
hx=LW*S/2; hy=lw/2*S+4*S
yy2,xx2=np.mgrid[0:LH*S,0:LW*S].astype(np.float32)
shaft=((np.abs(xx2-hx)<=lw/2*S)&(yy2>=hy)&(yy2<=hy+ln*S))|(((xx2-hx)**2+(yy2-hy-ln*S)**2)<=(lw/2*S)**2)
u=np.clip((xx2-(hx-lw/2*S))/(lw*S),0,1)
c0=np.array([0x3C,0xC1,0x91])/255; c1=np.array([0x23,0x90,0x5F])/255
g[...,:3]=c0*(1-u[...,None])+c1*u[...,None]; g[...,3]=shaft
foot=(((xx2-(hx+lw*0.3*S))/(fw*S))**2+((yy2-(hy+(ln+lw*0.1)*S))/(fh*S))**2)<=1
g[foot,:3]=np.array([0x2A,0x9D,0x71])/255; g[foot,3]=1
legI=img(g).resize((LW,LH),Image.LANCZOS); legI.save(f'{OUT}/leg.png',optimize=True)
legPivot=[LW/2,lw/2+4]

def bottom_round(r):
    m=Image.new('L',(W*2,H*2),0); ImageDraw.Draw(m).rounded_rectangle((0,-H*2,W*2-1,H*2-1),radius=int(r*2),fill=255)
    return m.resize((W,H),Image.LANCZOS)
R=0.36*W
rig={
  "source":"marketing/character/sprout-base.png, ground keyed out, framed as site/img/sprout-corner.webp",
  "frame":[W,H],
  "parts":{
    "body":{"file":"body.png","at":[0,0]},
    "arm-right":{"file":"arm-right.png","at":list(boxR[:2]),"pivot":[round(420*k),round(705*k)],"order":"behind arm-left"},
    "arm-left":{"file":"arm-left.png","at":list(boxL[:2]),"pivot":[round(250*k),round(705*k)]},
    "leg":{"file":"leg.png","size":[LW,LH],"pivot":[round(legPivot[0],1),round(legPivot[1],1)],
           "hips":[[round(W/2-0.12*h),round(H-0.07*h)],[round(W/2+0.12*h),round(H-0.07*h)]],"order":"behind body"}
  },
  "bottomRadius":round(R),
  "notes":"Angles are radians, clockwise positive (canvas rotate). Arms at 0 reproduce the original exactly. A walking or sitting figure clips body and arms to a rounded bottom of bottomRadius; the corner placement uses no rounding and no legs.",
  "poses":{"sitting":{"legLeft":0.10,"legRight":-0.16,"armLeft":0,"armRight":0}}
}
json.dump(rig,open(f'{OUT}/rig.json','w'),indent=2)

# Sitting composite: legs dangling, arms at rest, bottom rounded.
pose=rig['poses']['sitting']; pad=int(0.2*h)
canvas=Image.new('RGBA',(W,H+pad),(0,0,0,0))
for (hxp,hyp),ang in zip(rig['parts']['leg']['hips'],[pose['legLeft'],pose['legRight']]):
    L2=Image.new('RGBA',canvas.size,(0,0,0,0)); L2.alpha_composite(legI,(int(hxp-legPivot[0]),int(hyp-legPivot[1])))
    canvas.alpha_composite(L2.rotate(-np.degrees(ang),center=(hxp,hyp),resample=Image.BICUBIC))
fig=Image.new('RGBA',(W,H),(0,0,0,0)); fig.alpha_composite(bodyI)
fig.alpha_composite(armR.copy()); fig.alpha_composite(armL.copy())
clip=bottom_round(R); fa=np.asarray(fig).copy(); fa[...,3]=(fa[...,3].astype(np.float32)*np.asarray(clip)/255).astype(np.uint8)
canvas.alpha_composite(Image.fromarray(fa,'RGBA'))
canvas=canvas.crop(canvas.getbbox()); canvas.save(f'{OUT}/sprout-sitting.png',optimize=True)
print('frame',W,H,'arms',boxL,boxR,'sitting',canvas.size)
# Web-weight copy at the corner cut-out's height, for a page to use directly.
wv=canvas.resize((round(canvas.width*720/H),round(canvas.height*720/H)),Image.LANCZOS)
wv.save(f'{OUT}/sprout-sitting.webp',quality=90,alpha_quality=100,method=6)
print('webp',wv.size)
