from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(UserBase)
admin.site.register(PatternAnalysis)
admin.site.register(WasteLog)
admin.site.register(UserPreferences)
admin.site.register(Recommendation)
admin.site.register(ImpactScore)
admin.site.register(SDGScore)